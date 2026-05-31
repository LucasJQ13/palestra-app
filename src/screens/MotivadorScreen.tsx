import React, { useEffect, useState } from 'react';
import { Image, Linking, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notilestra } from '../data/content';
import { fetchMotivadorPeriods, fetchNotilestra } from '../lib/remoteData';
import { AppContentBlock } from '../lib/profiles';
import { PageEditorProps } from '../lib/navigationConstants';
import { AppAdminConfig } from '../lib/appConfig';
import { groupMotivadorFeedItems, AgendaItem } from '../lib/agendaHelpers';
import { Session } from '../types/auth';
import { EditableIntro } from '../components/EditableIntro';
import { SectionTitle } from '../components/SectionTitle';
import { useIsDarkTheme } from '../theme/ThemeContext';
import { palette } from '../theme/palette';
import { styles } from '../theme/appStyles';

export function MotivadorScreen({ session, title, content, refreshKey, editor, adminConfig }: { session: Session | null; title: string; content?: AppContentBlock; refreshKey: number; editor?: PageEditorProps; adminConfig: AppAdminConfig }) {
  const isDark = useIsDarkTheme();
  const [items, setItems] = useState<AgendaItem[]>([]);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchMotivadorPeriods(session), fetchNotilestra(session)]).then(([pmPeriods, events]) => {
      if (alive) {
        const pmItems = events.filter((item) => {
          const text = `${item.title} ${item.body} ${item.scope}`.toLowerCase();
          return text.includes('periodo motivador') || text.includes(' pm ') || text.includes('retiro');
        });
        setItems(pmPeriods.length > 0 ? groupMotivadorFeedItems(pmPeriods) : groupMotivadorFeedItems(pmItems));
      }
    });
    return () => {
      alive = false;
    };
  }, [refreshKey, session?.province, session?.role]);

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {adminConfig.periodoMotivador.imageUrl ? (
        <View style={[styles.featurePanel, isDark && styles.surfacePanelDark]}>
          <Image source={{ uri: adminConfig.periodoMotivador.imageUrl }} style={styles.cardImage} />
        </View>
      ) : null}
      <SectionTitle title="Agenda de PM" />
      {items.length === 0 ? (
        <View style={[styles.card, isDark && styles.surfaceCardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>No hay PM activos</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Cuando se carguen PM reales y activos en Supabase, apareceran aca.</Text>
        </View>
      ) : null}
      {items.map((item, index) => (
        <View key={`${item.title}-${index}`} style={[styles.card, styles.feedCard, isDark && styles.feedCardDark]}>
          <View style={styles.feedHeader}>
            <View style={styles.feedAvatar}>
              <Ionicons name="flame-outline" size={18} color={palette.red} />
            </View>
            <View style={styles.feedHeaderText}>
              <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{item.scope}</Text>
              <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>{new Date(`${item.date}T00:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
          </View>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{item.title}</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{item.body}</Text>
          {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.cardImage} /> : null}
          {item.mapUrl ? (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openURL(item.mapUrl as string)}>
              <Ionicons name="map-outline" size={17} color={palette.red} />
              <Text style={styles.secondaryButtonText}>Abrir mapa</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
      {session?.role === 'administrador' ? (
        <View style={styles.notice}>
          <Ionicons name="archive-outline" size={20} color={palette.red} />
          <Text style={styles.noticeText}>El registro histórico de PM queda disponible acá; las fechas cargadas en Supabase también se reflejan en el calendario de Noticias.</Text>
        </View>
      ) : null}
    </View>
  );
}
