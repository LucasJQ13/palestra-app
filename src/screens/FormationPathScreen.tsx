import React, { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContentBlock, AppMaterialRecord, FormationPathStationRecord, fetchAppMaterials, fetchFormationPathStations } from '../lib/profiles';
import { PageEditorProps } from '../lib/navigationConstants';
import { normalizeExternalUrl } from '../lib/urls';
import { roleRank } from '../lib/roles';
import { roleLabel } from '../lib/profileDisplay';
import { Session } from '../types/auth';
import { EditableIntro } from '../components/EditableIntro';
import { SectionTitle } from '../components/SectionTitle';
import { useIsDarkTheme } from '../theme/ThemeContext';
import { palette } from '../theme/palette';
import { styles } from '../theme/appStyles';

function isIoniconName(value?: string | null): value is keyof typeof Ionicons.glyphMap {
  return Boolean(value && value in Ionicons.glyphMap);
}

function canSeeStation(session: Session | null, station: FormationPathStationRecord) {
  if (!station.is_active) {
    return false;
  }
  if (!station.visible_roles || station.visible_roles.length === 0) {
    return true;
  }
  return station.visible_roles.includes(session?.role ?? 'invitado');
}

function isLeader(session: Session | null) {
  return roleRank(session?.role ?? 'invitado') >= roleRank('animador_comunidad');
}

function stationMaterials(station: FormationPathStationRecord, materials: AppMaterialRecord[]) {
  const ids = station.material_ids ?? [];
  return ids
    .map((id) => materials.find((material) => material.id === id))
    .filter(Boolean) as AppMaterialRecord[];
}

export function FormationPathScreen({
  session,
  title,
  content,
  editor,
  refreshKey
}: {
  session: Session | null;
  title: string;
  content?: AppContentBlock;
  editor?: PageEditorProps;
  refreshKey: number;
}) {
  const isDark = useIsDarkTheme();
  const [stations, setStations] = useState<FormationPathStationRecord[]>([]);
  const [materials, setMaterials] = useState<AppMaterialRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const [stationRows, materialRows] = await Promise.all([
        fetchFormationPathStations(false),
        fetchAppMaterials(false)
      ]);
      if (!mounted) {
        return;
      }
      const visibleStations = stationRows.filter((station) => canSeeStation(session, station));
      setStations(visibleStations);
      setMaterials(materialRows);
      setSelectedId((current) => current && visibleStations.some((station) => station.id === current) ? current : visibleStations[0]?.id ?? null);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [session?.role, refreshKey]);

  const selected = useMemo(() => stations.find((station) => station.id === selectedId) ?? null, [selectedId, stations]);
  const leaderView = isLeader(session);

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      <View style={[styles.formationHero, isDark && styles.formationHeroDark]}>
        <View style={styles.formationHeroIcon}>
          <Ionicons name="map-outline" size={28} color={palette.red} />
        </View>
        <View style={styles.adminUserHeaderText}>
          <Text style={[styles.formationHeroTitle, isDark && styles.textDarkStrong]}>Camino de formación</Text>
          <Text style={[styles.formationHeroBody, isDark && styles.textDarkBody]}>Tocá una estación para abrir su contenido y materiales relacionados.</Text>
        </View>
      </View>

      {loading ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Cargando camino formativo...</Text> : null}
      {!loading && stations.length === 0 ? (
        <View style={[styles.card, isDark && styles.surfacePanelDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Todavía no hay estaciones visibles.</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Cuando se carguen desde el Panel Dirigencial van a aparecer acá.</Text>
        </View>
      ) : null}

      <View style={styles.formationPath}>
        {stations.map((station, index) => {
          const selectedStation = selectedId === station.id;
          const color = station.color?.trim() || palette.red;
          const iconName = isIoniconName(station.icon_name) ? station.icon_name : 'flag-outline';
          return (
            <TouchableOpacity key={station.id} style={styles.formationStationRow} activeOpacity={0.88} onPress={() => setSelectedId(selectedStation ? null : station.id)}>
              <View style={styles.formationRail}>
                <View style={[styles.formationStationNode, { backgroundColor: color }]}>
                  <Ionicons name={iconName} size={18} color={palette.white} />
                </View>
                {index < stations.length - 1 ? <View style={[styles.formationStationLine, { backgroundColor: color }]} /> : null}
              </View>
              <View style={[styles.formationStationCard, isDark && styles.surfacePanelDark, selectedStation && styles.formationStationCardActive]}>
                <View style={styles.formationStationHeader}>
                  <View style={styles.adminUserHeaderText}>
                    <Text style={[styles.formationStationTitle, isDark && styles.textDarkStrong]}>{station.title}</Text>
                    {station.subtitle ? <Text style={[styles.formationStationSubtitle, isDark && styles.textDarkAccent]}>{station.subtitle}</Text> : null}
                  </View>
                  <Ionicons name={selectedStation ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color={color} />
                </View>
                {station.short_description ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{station.short_description}</Text> : null}
                {selectedStation ? (
                  <View style={styles.formationStationExpanded}>
                    {station.image_url?.trim() ? <Image source={{ uri: station.image_url.trim() }} style={styles.formationStationImage} /> : null}
                    <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{leaderView && station.leader_content ? 'Contenido para dirigentes' : 'Contenido para jovenes'}</Text>
                    <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{(leaderView && station.leader_content ? station.leader_content : station.young_content) || 'Contenido pendiente de carga.'}</Text>
                    {station.visible_roles?.length ? (
                      <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>Visible para: {station.visible_roles.map((role) => roleLabel(role as Session['role'])).join(', ')}</Text>
                    ) : null}
                    {stationMaterials(station, materials).length ? (
                      <View style={styles.stackTight}>
                        <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Materiales vinculados</Text>
                        {stationMaterials(station, materials).map((material) => (
                          <TouchableOpacity key={material.id} style={styles.formationMaterialChip} onPress={() => material.file_url ? Linking.openURL(normalizeExternalUrl(material.file_url)) : undefined}>
                            <Ionicons name="document-text-outline" size={17} color={palette.red} />
                            <View style={styles.adminUserHeaderText}>
                              <Text style={styles.secondaryButtonText}>{material.title}</Text>
                              {material.description ? <Text style={styles.feedMeta}>{material.description}</Text> : null}
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
