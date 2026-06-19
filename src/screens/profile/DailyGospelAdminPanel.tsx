import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';
import { inputPlaceholderColor } from '../../lib/constants';
import { AppAdminConfig } from '../../lib/appConfig';
import { APP_MESSAGES } from '../../lib/appMessages';
import { AppButton } from '../../components/ui';

export function DailyGospelAdminPanel({
  config,
  isDark,
  onPatch,
  onSave
}: {
  config: AppAdminConfig;
  isDark: boolean;
  onPatch: (patch: Partial<AppAdminConfig['gospel']>) => void;
  onSave: () => void;
}) {
  return (
    <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
      <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{APP_MESSAGES.adminPanels.gospel.title}</Text>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.adminPanels.gospel.help}</Text>
      <TouchableOpacity
        style={[styles.adminListRow, config.gospel.enabled && styles.adminListRowActive]}
        onPress={() => onPatch({ enabled: !config.gospel.enabled })}
      >
        <Ionicons name={config.gospel.enabled ? 'toggle' : 'toggle-outline'} size={24} color={config.gospel.enabled ? palette.red : palette.inkMuted} />
        <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{config.gospel.enabled ? APP_MESSAGES.adminPanels.gospel.enabled : APP_MESSAGES.adminPanels.gospel.disabled}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.adminListRow, config.gospel.autoUpdate !== false && styles.adminListRowActive]}
        onPress={() => onPatch({ autoUpdate: config.gospel.autoUpdate === false })}
      >
        <Ionicons name={config.gospel.autoUpdate !== false ? 'toggle' : 'toggle-outline'} size={24} color={config.gospel.autoUpdate !== false ? palette.red : palette.inkMuted} />
        <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{config.gospel.autoUpdate !== false ? APP_MESSAGES.adminPanels.gospel.autoEnabled : APP_MESSAGES.adminPanels.gospel.autoDisabled}</Text>
      </TouchableOpacity>
      <Text style={[styles.inputLabel, isDark && styles.textDarkAccent]}>{APP_MESSAGES.adminPanels.gospel.titleLabel}</Text>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        value={config.gospel.title}
        onChangeText={(value) => onPatch({ title: value })}
        placeholder="Evangelio del Dia"
        placeholderTextColor={inputPlaceholderColor}
      />
      <Text style={[styles.inputLabel, isDark && styles.textDarkAccent]}>{APP_MESSAGES.adminPanels.gospel.sourceLabel}</Text>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        value={config.gospel.sourceUrl}
        onChangeText={(value) => onPatch({ sourceUrl: value })}
        placeholder="https://..."
        autoCapitalize="none"
        placeholderTextColor={inputPlaceholderColor}
      />
      <Text style={[styles.inputLabel, isDark && styles.textDarkAccent]}>{APP_MESSAGES.adminPanels.gospel.reflectionSourceLabel}</Text>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        value={config.gospel.reflectionSourceUrl ?? ''}
        onChangeText={(value) => onPatch({ reflectionSourceUrl: value })}
        placeholder="https://... puede ser la misma u otra pagina"
        autoCapitalize="none"
        placeholderTextColor={inputPlaceholderColor}
      />
      <Text style={[styles.inputLabel, isDark && styles.textDarkAccent]}>{APP_MESSAGES.adminPanels.gospel.manualLabel}</Text>
      <TextInput
        style={[styles.input, styles.textArea, isDark && styles.inputDark]}
        value={config.gospel.body}
        onChangeText={(value) => onPatch({ body: value })}
        multiline
        placeholder="Texto del evangelio..."
        placeholderTextColor={inputPlaceholderColor}
      />
      <AppButton label={APP_MESSAGES.adminPanels.gospel.save} icon="save-outline" onPress={onSave} />
    </View>
  );
}
