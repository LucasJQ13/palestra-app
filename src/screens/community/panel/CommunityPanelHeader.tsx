import React from 'react';
import { Text, View } from 'react-native';
import { IconButton } from '../../../components/ui';
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
      <IconButton icon="arrow-back-outline" onPress={onBack} accessibilityLabel="Volver a Mi Comunidad" />
      <View style={styles.titleWrap}>
        <Text style={styles.eyebrow}>Herramientas comunitarias</Text>
        <Text style={[styles.title, isDark && styles.titleDark]}>Panel de {communityName || 'Comunidad'}</Text>
      </View>
    </View>
  );
}
