import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';
import { calendarActivities, news, notilestra } from '../../data/content';
import { fallbackContentKey } from '../../lib/contentBlocks';
import { AppContentBlock } from '../../lib/profiles';
import { APP_MESSAGES } from '../../lib/appMessages';
import { AppButton } from '../../components/ui';

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
      <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{APP_MESSAGES.adminPanels.content.title}</Text>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.adminPanels.content.help}</Text>
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.adminPanels.content.editablePages}</Text>
      {appContent.length === 0 ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.adminPanels.content.noEditablePages}</Text> : null}
      {appContent.map((item) => (
        <View key={item.tab_key} style={[styles.adminListRow, isDark && styles.surfaceRowDark]}>
          <Ionicons name="document-text-outline" size={20} color={palette.red} />
          <View style={styles.adminUserHeaderText}>
            <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{item.title || item.tab_key}</Text>
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.adminPanels.content.sourceTab(item.tab_key)}</Text>
          </View>
          <AppButton label="Editar" icon="create-outline" variant="ghost" size="compact" onPress={() => onEditContent(item.tab_key)} />
        </View>
      ))}
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.adminPanels.content.fallbackTitle}</Text>
      {fallbackItems.map((item) => {
        const hidden = hiddenFallbackContent.includes(item.key);
        return (
          <View key={item.key} style={[styles.adminListRow, isDark && styles.surfaceRowDark, hidden && styles.lockedCard]}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={palette.red} />
            <View style={styles.adminUserHeaderText}>
              <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{item.title}</Text>
              <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{item.section} - {item.origin} - {hidden ? APP_MESSAGES.adminPanels.content.hidden : APP_MESSAGES.adminPanels.content.visible}</Text>
            </View>
            <AppButton label={hidden ? 'Mostrar' : 'Ocultar'} icon={hidden ? 'eye-outline' : 'eye-off-outline'} variant="ghost" size="compact" onPress={() => onToggleFallback(item.key, !hidden)} />
          </View>
        );
      })}
    </View>
  );
}
