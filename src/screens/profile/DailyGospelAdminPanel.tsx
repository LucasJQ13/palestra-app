import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';
import { inputPlaceholderColor } from '../../lib/constants';
import { AppAdminConfig } from '../../lib/appConfig';
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
      <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Evangelio del Dia</Text>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Configura el Evangelio diario automatico. Don Bosco queda como fuente inicial y puedes cambiar la fuente de reflexion si hace falta.</Text>
      <TouchableOpacity
        style={[styles.adminListRow, config.gospel.enabled && styles.adminListRowActive]}
        onPress={() => onPatch({ enabled: !config.gospel.enabled })}
      >
        <Ionicons name={config.gospel.enabled ? 'toggle' : 'toggle-outline'} size={24} color={config.gospel.enabled ? palette.red : palette.inkMuted} />
        <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{config.gospel.enabled ? 'Evangelio activo' : 'Evangelio desactivado'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.adminListRow, config.gospel.autoUpdate !== false && styles.adminListRowActive]}
        onPress={() => onPatch({ autoUpdate: config.gospel.autoUpdate === false })}
      >
        <Ionicons name={config.gospel.autoUpdate !== false ? 'toggle' : 'toggle-outline'} size={24} color={config.gospel.autoUpdate !== false ? palette.red : palette.inkMuted} />
        <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{config.gospel.autoUpdate !== false ? 'Actualizacion automatica activa' : 'Actualizacion automatica desactivada'}</Text>
      </TouchableOpacity>
      <Text style={[styles.inputLabel, isDark && styles.textDarkAccent]}>Titulo</Text>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        value={config.gospel.title}
        onChangeText={(value) => onPatch({ title: value })}
        placeholder="Evangelio del Dia"
        placeholderTextColor={inputPlaceholderColor}
      />
      <Text style={[styles.inputLabel, isDark && styles.textDarkAccent]}>Fuente del Evangelio</Text>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        value={config.gospel.sourceUrl}
        onChangeText={(value) => onPatch({ sourceUrl: value })}
        placeholder="https://..."
        autoCapitalize="none"
        placeholderTextColor={inputPlaceholderColor}
      />
      <Text style={[styles.inputLabel, isDark && styles.textDarkAccent]}>Fuente de reflexion</Text>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        value={config.gospel.reflectionSourceUrl ?? ''}
        onChangeText={(value) => onPatch({ reflectionSourceUrl: value })}
        placeholder="https://... puede ser la misma u otra pagina"
        autoCapitalize="none"
        placeholderTextColor={inputPlaceholderColor}
      />
      <Text style={[styles.inputLabel, isDark && styles.textDarkAccent]}>Evangelio cargado manualmente</Text>
      <TextInput
        style={[styles.input, styles.textArea, isDark && styles.inputDark]}
        value={config.gospel.body}
        onChangeText={(value) => onPatch({ body: value })}
        multiline
        placeholder="Texto del evangelio..."
        placeholderTextColor={inputPlaceholderColor}
      />
      <AppButton label="Guardar Evangelio" icon="save-outline" onPress={onSave} />
    </View>
  );
}
