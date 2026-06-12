import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../../theme/palette';
import { communityPanelStyles as styles } from './communityPanelStyles';

export function CommunityPanelHeader({
  communityName,
  isDark,
  onBack
}: {
  communityName: string;
  isDark: boolean;
  onBack: () => void;
}) {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity style={[styles.backButton, isDark && styles.backButtonDark]} onPress={onBack} accessibilityLabel="Volver a Mi Comunidad">
        <Ionicons name="arrow-back-outline" size={21} color={palette.red} />
      </TouchableOpacity>
      <View style={styles.titleWrap}>
        <Text style={styles.eyebrow}>Herramientas comunitarias</Text>
        <Text style={[styles.title, isDark && styles.titleDark]}>Panel de {communityName || 'Comunidad'}</Text>
      </View>
    </View>
  );
}
