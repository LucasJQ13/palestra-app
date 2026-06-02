import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';
import { calendarActivities, news, notilestra } from '../../data/content';
import { fallbackContentKey } from '../../lib/contentBlocks';
import { AppContentBlock } from '../../lib/profiles';

type FallbackContentItem = {
  key: string;
  section: string;
  title: string;
  origin: string;
};

export function PublishedContentAdminPanel({
  appContent,
  hiddenFallbackContent,
  isDark,
  onEditContent,
  onToggleFallback
}: {
  appContent: AppContentBlock[];
  hiddenFallbackContent: string[];
  isDark: boolean;
  onEditContent: (tabKey: string) => void;
  onToggleFallback: (key: string, hidden: boolean) => void;
}) {
  const fallbackItems = useMemo<FallbackContentItem[]>(() => [
    ...news.map((item) => ({ key: fallbackContentKey('home', item.title), section: 'Home', title: item.title, origin: 'Fallback local' })),
    ...notilestra.map((item) => ({ key: fallbackContentKey('notilestra', item.title, item.date), section: 'Noticias/Agenda', title: item.title, origin: `Fallback local - ${item.date}` })),
    ...calendarActivities.map((item) => ({ key: fallbackContentKey('calendario', item.title, item.date), section: 'Calendario', title: item.title, origin: `Fallback local - ${item.date}` }))
  ], []);

  return (
    <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
      <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Contenido Publicado</Text>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Inventario central para distinguir contenido real de Supabase y contenido base/fallback usado para que la app no quede vacia.</Text>
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Paginas editables en Supabase</Text>
      {appContent.length === 0 ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>No hay paginas publicadas cargadas desde Supabase.</Text> : null}
      {appContent.map((item) => (
        <View key={item.tab_key} style={[styles.adminListRow, isDark && styles.surfaceRowDark]}>
          <Ionicons name="document-text-outline" size={20} color={palette.red} />
          <View style={styles.adminUserHeaderText}>
            <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{item.title || item.tab_key}</Text>
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Origen: Supabase - pestana {item.tab_key}</Text>
          </View>
          <TouchableOpacity style={styles.actionPill} onPress={() => onEditContent(item.tab_key)}>
            <Text style={styles.actionPillText}>Editar</Text>
          </TouchableOpacity>
        </View>
      ))}
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Contenido base / fallback</Text>
      {fallbackItems.map((item) => {
        const hidden = hiddenFallbackContent.includes(item.key);
        return (
          <View key={item.key} style={[styles.adminListRow, isDark && styles.surfaceRowDark, hidden && styles.lockedCard]}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={palette.red} />
            <View style={styles.adminUserHeaderText}>
              <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{item.title}</Text>
              <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{item.section} - {item.origin} - {hidden ? 'oculto' : 'visible'}</Text>
            </View>
            <TouchableOpacity style={styles.actionPill} onPress={() => onToggleFallback(item.key, !hidden)}>
              <Text style={styles.actionPillText}>{hidden ? 'Mostrar' : 'Ocultar'}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}
