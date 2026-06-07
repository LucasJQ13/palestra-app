import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';
import { inputPlaceholderColor } from '../../lib/constants';
import { uploadPickedImageToPublicUrl } from '../../lib/uploads';
import { APP_MESSAGES } from '../../lib/appMessages';
import { roleLabel } from '../../lib/profileDisplay';
import { visibleHierarchyFor } from '../../lib/roles';
import { canManageFormationPathAdmin } from '../../lib/sessionAccess';
import { Role, Session } from '../../types/auth';
import {
  AppMaterialRecord,
  FormationPathStationRecord,
  archiveFormationPathStation,
  fetchAppMaterials,
  fetchFormationPathStations,
  saveFormationPathStation,
  setFormationPathStationStatus
} from '../../lib/profiles';

type Draft = {
  id?: string | null;
  title: string;
  subtitle: string;
  shortDescription: string;
  imageUrl: string;
  iconName: string;
  color: string;
  sortOrder: string;
  youngContent: string;
  leaderContent: string;
  visibleRoles: Role[];
  isActive: boolean;
  materialIds: string[];
};

const defaultColors = ['#2d8dc8', '#f28a00', '#3b8f5a', '#8f5bd8', '#d84a4a', '#1b6f8f'];
const defaultIcons: Array<keyof typeof Ionicons.glyphMap> = ['sparkles-outline', 'flame-outline', 'people-outline', 'heart-outline', 'construct-outline', 'trail-sign-outline', 'earth-outline'];

function emptyDraft(order = 1): Draft {
  return {
    title: '',
    subtitle: '',
    shortDescription: '',
    imageUrl: '',
    iconName: 'trail-sign-outline',
    color: defaultColors[(order - 1) % defaultColors.length],
    sortOrder: String(order),
    youngContent: '',
    leaderContent: '',
    visibleRoles: [],
    isActive: true,
    materialIds: []
  };
}

function draftFromStation(station: FormationPathStationRecord): Draft {
  return {
    id: station.id,
    title: station.title,
    subtitle: station.subtitle ?? '',
    shortDescription: station.short_description ?? '',
    imageUrl: station.image_url ?? '',
    iconName: station.icon_name ?? 'trail-sign-outline',
    color: station.color ?? '#2d8dc8',
    sortOrder: String(station.sort_order ?? 100),
    youngContent: station.young_content ?? '',
    leaderContent: station.leader_content ?? '',
    visibleRoles: (station.visible_roles ?? []) as Role[],
    isActive: station.is_active,
    materialIds: station.material_ids ?? []
  };
}

export function FormationPathAdminPanel({ session, isDark }: { session: Session; isDark: boolean }) {
  const [stations, setStations] = useState<FormationPathStationRecord[]>([]);
  const [materials, setMaterials] = useState<AppMaterialRecord[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [message, setMessage] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);

  const canManage = canManageFormationPathAdmin(session);
  const roleOptions = useMemo(() => visibleHierarchyFor(session).map((item) => item.role as Role), [session.role]);

  async function load() {
    const [stationRows, materialRows] = await Promise.all([
      fetchFormationPathStations(true),
      fetchAppMaterials(true)
    ]);
    setStations(stationRows);
    setMaterials(materialRows);
    if (!draft.id && stationRows.length === 0) {
      setDraft(emptyDraft(1));
    }
  }

  useEffect(() => {
    load();
  }, []);

  function patch(values: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...values }));
  }

  function toggleRole(role: Role) {
    patch({
      visibleRoles: draft.visibleRoles.includes(role)
        ? draft.visibleRoles.filter((item) => item !== role)
        : [...draft.visibleRoles, role]
    });
  }

  function toggleMaterial(id: string) {
    patch({
      materialIds: draft.materialIds.includes(id)
        ? draft.materialIds.filter((item) => item !== id)
        : [...draft.materialIds, id]
    });
  }

  async function uploadImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage(APP_MESSAGES.photoPermission);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.78
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    try {
      setMessage('Subiendo imagen...');
      const publicUrl = await uploadPickedImageToPublicUrl(result.assets[0], 'formation-path');
      patch({ imageUrl: publicUrl });
      setMessage('Imagen cargada.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pude subir la imagen.');
    }
  }

  async function save() {
    if (!canManage) {
      setMessage('No tenes permisos para administrar el Proceso Educativo.');
      return;
    }
    if (!draft.title.trim()) {
      setMessage('La estacion necesita un titulo.');
      return;
    }
    const result = await saveFormationPathStation({
      id: draft.id ?? null,
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim() || null,
      shortDescription: draft.shortDescription.trim() || null,
      imageUrl: draft.imageUrl.trim() || null,
      iconName: draft.iconName.trim() || 'trail-sign-outline',
      color: draft.color.trim() || '#2d8dc8',
      sortOrder: Number(draft.sortOrder.replace(/[^0-9-]/g, '')) || 100,
      youngContent: draft.youngContent.trim() || null,
      leaderContent: draft.leaderContent.trim() || null,
      visibleRoles: draft.visibleRoles.length ? draft.visibleRoles : null,
      isActive: draft.isActive,
      materialIds: draft.materialIds
    });
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    setMessage('Estacion guardada.');
    setShowEditor(false);
    await load();
  }

  async function toggleActive(station: FormationPathStationRecord) {
    const result = await setFormationPathStationStatus(station.id, !station.is_active);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    setMessage(station.is_active ? 'Estacion desactivada.' : 'Estacion activada.');
    await load();
  }

  async function archiveStation(station: FormationPathStationRecord) {
    const result = await archiveFormationPathStation(station.id);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    setMessage('Estacion eliminada.');
    if (draft.id === station.id) {
      setDraft(emptyDraft(stations.length + 1));
      setShowEditor(false);
    }
    await load();
  }

  return (
    <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
      <View style={styles.adminHeaderRow}>
        <View style={styles.adminUserHeaderText}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Proceso Educativo</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Crea y ordena estaciones del camino formativo. El contenido queda guardado en Supabase.</Text>
        </View>
        <TouchableOpacity style={styles.iconButtonGhost} onPress={load}>
          <Ionicons name="refresh-outline" size={18} color={palette.red} />
        </TouchableOpacity>
      </View>

      {!canManage ? (
        <View style={styles.notice}>
          <Ionicons name="lock-closed-outline" size={20} color={palette.red} />
          <Text style={styles.noticeText}>Disponible solo para Administrador.</Text>
        </View>
      ) : null}

      <View style={styles.inlineActions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            setDraft(emptyDraft(stations.length + 1));
            setShowEditor(true);
          }}
        >
          <Ionicons name="add-circle-outline" size={17} color={palette.white} />
          <Text style={styles.primaryButtonText}>Crear estacion</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowEditor((current) => !current)}>
          <Ionicons name={showEditor ? 'chevron-up-outline' : 'create-outline'} size={17} color={palette.red} />
          <Text style={styles.secondaryButtonText}>{showEditor ? 'Cerrar editor' : 'Editar seleccion'}</Text>
        </TouchableOpacity>
      </View>

      {showEditor ? (
        <View style={[styles.inlineEditorPanel, isDark && styles.surfacePanelDark]}>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{draft.id ? 'Editar estacion' : 'Nueva estacion'}</Text>
          <TextInput style={styles.input} placeholder="Titulo" value={draft.title} onChangeText={(value) => patch({ title: value })} placeholderTextColor={inputPlaceholderColor} />
          <TextInput style={styles.input} placeholder="Subtitulo" value={draft.subtitle} onChangeText={(value) => patch({ subtitle: value })} placeholderTextColor={inputPlaceholderColor} />
          <TextInput style={[styles.input, styles.textArea]} placeholder="Descripcion breve" value={draft.shortDescription} onChangeText={(value) => patch({ shortDescription: value })} multiline placeholderTextColor={inputPlaceholderColor} />
          <View style={styles.navigationFieldGrid}>
            <View style={styles.navigationField}>
              <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Orden</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={draft.sortOrder} onChangeText={(value) => patch({ sortOrder: value })} placeholderTextColor={inputPlaceholderColor} />
            </View>
            <View style={styles.navigationField}>
              <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Icono</Text>
              <TextInput style={styles.input} value={draft.iconName} onChangeText={(value) => patch({ iconName: value })} autoCapitalize="none" placeholderTextColor={inputPlaceholderColor} />
            </View>
          </View>
          <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Iconos rapidos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigationIconPicker}>
            {defaultIcons.map((icon) => (
              <TouchableOpacity key={icon} style={[styles.navigationIconChoice, draft.iconName === icon && styles.navigationIconChoiceActive]} onPress={() => patch({ iconName: icon })}>
                <Ionicons name={icon} size={21} color={draft.iconName === icon ? palette.white : palette.red} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Color</Text>
          <View style={styles.horizontalChips}>
            {defaultColors.map((color) => (
              <TouchableOpacity key={color} style={[styles.colorSwatch, { backgroundColor: color }, draft.color === color && styles.colorSwatchActive]} onPress={() => patch({ color })} />
            ))}
          </View>
          <TextInput style={styles.input} placeholder="#2d8dc8" value={draft.color} onChangeText={(value) => patch({ color: value })} autoCapitalize="none" placeholderTextColor={inputPlaceholderColor} />

          <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Imagen opcional</Text>
          <View style={styles.inlineActions}>
            <TouchableOpacity style={styles.smallActionButton} onPress={uploadImage}>
              <Ionicons name="image-outline" size={16} color={palette.red} />
              <Text style={styles.smallActionText}>Subir imagen</Text>
            </TouchableOpacity>
          </View>
          <TextInput style={styles.input} placeholder="URL de imagen" value={draft.imageUrl} onChangeText={(value) => patch({ imageUrl: value })} autoCapitalize="none" placeholderTextColor={inputPlaceholderColor} />
          {draft.imageUrl.trim() ? <Image source={{ uri: draft.imageUrl.trim() }} style={styles.formationStationImage} /> : null}

          <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Contenido para joven</Text>
          <TextInput style={[styles.input, styles.textArea]} value={draft.youngContent} onChangeText={(value) => patch({ youngContent: value })} multiline placeholder="Contenido que ven jovenes, palestristas y sedimentadores" placeholderTextColor={inputPlaceholderColor} />
          <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Contenido para dirigente</Text>
          <TextInput style={[styles.input, styles.textArea]} value={draft.leaderContent} onChangeText={(value) => patch({ leaderContent: value })} multiline placeholder="Contenido ampliado para dirigentes" placeholderTextColor={inputPlaceholderColor} />

          <View style={styles.adminListRow}>
            <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{draft.isActive ? 'Estacion activa' : 'Estacion inactiva'}</Text>
            <Switch value={draft.isActive} onValueChange={(value) => patch({ isActive: value })} />
          </View>

          <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Visibilidad por rango</Text>
          <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>Si no seleccionas rangos, queda visible para todos.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
            {roleOptions.map((role) => (
              <TouchableOpacity key={role} style={[styles.filterChip, draft.visibleRoles.includes(role) && styles.filterChipActive]} onPress={() => toggleRole(role)}>
                <Text style={[styles.filterChipText, draft.visibleRoles.includes(role) && styles.filterChipTextActive]}>{roleLabel(role)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowMaterials((current) => !current)}>
            <Ionicons name={showMaterials ? 'chevron-up-outline' : 'folder-open-outline'} size={17} color={palette.red} />
            <Text style={styles.secondaryButtonText}>Materiales vinculados ({draft.materialIds.length})</Text>
          </TouchableOpacity>
          {showMaterials ? (
            <View style={styles.profileCommunityPanel}>
              {materials.length === 0 ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>No hay materiales cargados.</Text> : null}
              {materials.map((material) => {
                const selected = draft.materialIds.includes(material.id);
                return (
                  <TouchableOpacity key={material.id} style={[styles.adminListRow, selected && styles.adminListRowActive]} onPress={() => toggleMaterial(material.id)}>
                    <Ionicons name={selected ? 'checkbox-outline' : 'square-outline'} size={20} color={selected ? palette.red : palette.inkMuted} />
                    <View style={styles.adminUserHeaderText}>
                      <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{material.title}</Text>
                      <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>{material.category ?? 'Material'} - {material.visibility ?? 'publico'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          <TouchableOpacity style={styles.primaryButton} onPress={save}>
            <Ionicons name="save-outline" size={17} color={palette.white} />
            <Text style={styles.primaryButtonText}>Guardar estacion</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {message ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{message}</Text> : null}

      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Estaciones cargadas</Text>
      {stations.length === 0 ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>No hay estaciones cargadas.</Text> : null}
      {stations.map((station) => (
        <View key={station.id} style={[styles.adminListRow, isDark && styles.surfaceRowDark, !station.is_active && styles.lockedCard]}>
          <View style={[styles.formationStationNode, { backgroundColor: station.color || palette.red }]}>
            <Ionicons name={(station.icon_name && station.icon_name in Ionicons.glyphMap ? station.icon_name : 'flag-outline') as keyof typeof Ionicons.glyphMap} size={17} color={palette.white} />
          </View>
          <View style={styles.adminUserHeaderText}>
            <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{station.sort_order}. {station.title}</Text>
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{station.subtitle || station.short_description || 'Sin subtitulo'}</Text>
            <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>{station.is_active ? 'Activa' : 'Inactiva'} - {(station.visible_roles ?? []).length || 'Todos'} roles - {(station.material_ids ?? []).length} materiales</Text>
          </View>
          <View style={styles.inlineIconActions}>
            <TouchableOpacity style={styles.iconButtonGhost} onPress={() => { setDraft(draftFromStation(station)); setShowEditor(true); }}>
              <Ionicons name="create-outline" size={17} color={palette.red} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButtonGhost} onPress={() => toggleActive(station)}>
              <Ionicons name={station.is_active ? 'eye-off-outline' : 'eye-outline'} size={17} color={palette.red} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButtonGhost} onPress={() => archiveStation(station)}>
              <Ionicons name="trash-outline" size={17} color={palette.red} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}
