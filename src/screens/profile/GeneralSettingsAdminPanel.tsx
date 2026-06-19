import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';
import { inputPlaceholderColor } from '../../lib/constants';
import { AppAdminConfig } from '../../lib/appConfig';
import { APP_MESSAGES } from '../../lib/appMessages';
import { AppButton } from '../../components/ui';

const settingToggles: Array<{ key: keyof AppAdminConfig['settings']; label: string }> = [
  { key: 'maintenanceMode', label: 'Modo mantenimiento' },
  { key: 'futureForumEnabled', label: 'Preparar foro' },
  { key: 'nearbyCommunitySearchEnabled', label: 'Buscar comunidad cercana' },
  { key: 'secretariatsEnabled', label: 'Mostrar Secretariados' }
];

export function GeneralSettingsAdminPanel({
  config,
  isDark,
  onPatch,
  onSave
}: {
  config: AppAdminConfig;
  isDark: boolean;
  onPatch: (patch: Partial<AppAdminConfig['settings']>) => void;
  onSave: () => void;
}) {
  return (
    <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
      <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{APP_MESSAGES.adminPanels.settings.title}</Text>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.adminPanels.settings.help}</Text>
      <TextInput
        style={[styles.input, styles.textArea, isDark && styles.inputDark]}
        placeholder={APP_MESSAGES.adminPanels.settings.maintenancePlaceholder}
        value={config.settings.globalMessage}
        onChangeText={(value) => onPatch({ globalMessage: value })}
        multiline
        placeholderTextColor={inputPlaceholderColor}
      />
      {settingToggles.map((item) => {
        const active = Boolean(config.settings[item.key]);
        return (
          <TouchableOpacity key={item.key} style={[styles.adminListRow, active && styles.adminListRowActive]} onPress={() => onPatch({ [item.key]: !active } as Partial<AppAdminConfig['settings']>)}>
            <Ionicons name={active ? 'toggle' : 'toggle-outline'} size={24} color={active ? palette.red : palette.inkMuted} />
            <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.adminPanels.settings.navigationOrder}</Text>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.adminPanels.settings.navigationOrderHelp}</Text>
      <AppButton label={APP_MESSAGES.adminPanels.settings.save} icon="save-outline" onPress={onSave} />
    </View>
  );
}
