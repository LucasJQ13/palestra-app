import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';
import { inputPlaceholderColor } from '../../lib/constants';
import { AppAdminConfig } from '../../lib/appConfig';
import { PrayerIntentionRecord } from '../../lib/profiles';

export function IntentionsAdminPanel({
  config,
  isDark,
  intentions,
  message,
  onPatch,
  onSave,
  onLoad,
  onDelete
}: {
  config: AppAdminConfig;
  isDark: boolean;
  intentions: PrayerIntentionRecord[];
  message: string;
  onPatch: (patch: Partial<AppAdminConfig['intentions']>) => void;
  onSave: () => void;
  onLoad: () => void;
  onDelete: (item: PrayerIntentionRecord) => void;
}) {
  return (
    <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
      <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Intenciones</Text>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Configura el tiempo de rezo y audita las intenciones publicadas.</Text>
      <Text style={[styles.inputLabel, isDark && styles.textDarkAccent]}>Tiempo de rezo en segundos</Text>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        value={String(config.intentions.prayerSeconds)}
        onChangeText={(value) => {
          const seconds = Number(value.replace(/[^0-9]/g, ''));
          onPatch({ prayerSeconds: Number.isFinite(seconds) ? seconds : 60 });
        }}
        keyboardType="number-pad"
        placeholder="60"
        placeholderTextColor={inputPlaceholderColor}
      />
      <TouchableOpacity style={styles.primaryButton} onPress={onSave}>
        <Text style={styles.primaryButtonText}>Guardar configuracion</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={onLoad}>
        <Ionicons name="list-outline" size={17} color={palette.red} />
        <Text style={styles.secondaryButtonText}>Intenciones cargadas</Text>
      </TouchableOpacity>
      {message ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{message}</Text> : null}
      {intentions.map((item) => (
        <View key={item.id} style={styles.adminListRow}>
          <Ionicons name="flame-outline" size={20} color={palette.red} />
          <View style={styles.adminUserHeaderText}>
            <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{item.author_name || 'Palestrista'}</Text>
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{item.body}</Text>
            <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>{item.prayer_count} oraciones - {item.is_anonymous ? 'Subida como anonima' : 'Publica'}</Text>
          </View>
          <TouchableOpacity style={styles.actionPill} onPress={() => onDelete(item)}>
            <Ionicons name="trash-outline" size={16} color={palette.red} />
            <Text style={styles.actionPillText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}
