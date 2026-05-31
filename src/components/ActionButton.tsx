import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { styles } from '../theme/appStyles';

export function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.primaryButton} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}
