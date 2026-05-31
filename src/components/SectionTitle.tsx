import React from 'react';
import { Text } from 'react-native';
import { styles } from '../theme/appStyles';
import { useIsDarkTheme } from '../theme/ThemeContext';

export function SectionTitle({ title }: { title: string }) {
  const isDark = useIsDarkTheme();
  return <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>{title}</Text>;
}
