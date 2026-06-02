import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';
import { faqItems, movementHistory } from '../../data/content';

export function HistoryAdminPanel({
  isDark,
  onOpenEditor
}: {
  isDark: boolean;
  onOpenEditor: () => void;
}) {
  return (
    <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
      <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Nuestra Historia</Text>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Gestion de capitulos, preguntas frecuentes y textos institucionales desde el editor centralizado.</Text>
      <View style={[styles.adminListRow, isDark && styles.surfaceRowDark]}>
        <Ionicons name="book-outline" size={19} color={palette.red} />
        <View style={styles.adminUserHeaderText}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{movementHistory.length} capitulos actuales</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Migracion progresiva al editor de bloques.</Text>
        </View>
      </View>
      <View style={[styles.adminListRow, isDark && styles.surfaceRowDark]}>
        <Ionicons name="help-circle-outline" size={19} color={palette.red} />
        <View style={styles.adminUserHeaderText}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{faqItems.length} preguntas frecuentes</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Editable desde Contenido General por ahora.</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={onOpenEditor}>
        <Text style={styles.primaryButtonText}>Abrir editor de Historia</Text>
      </TouchableOpacity>
    </View>
  );
}
