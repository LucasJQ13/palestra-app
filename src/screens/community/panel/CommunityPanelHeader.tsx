import React from 'react';
import { Text, View } from 'react-native';
import { IconButton } from '../../../components/ui';
import { APP_MESSAGES } from '../../../lib/appMessages';
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
      <IconButton icon="arrow-back-outline" onPress={onBack} accessibilityLabel={APP_MESSAGES.community.panelBack} />
      <View style={styles.titleWrap}>
        <Text style={styles.eyebrow}>{APP_MESSAGES.community.panelEyebrow}</Text>
        <Text style={[styles.title, isDark && styles.titleDark]}>{APP_MESSAGES.community.panelTitle(communityName)}</Text>
      </View>
    </View>
  );
}
