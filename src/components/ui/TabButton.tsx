import React from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import type { ButtonIconName } from './AppButton';
import { buttonStyles, selectedTabColors } from './buttonStyles';

export type TabButtonProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: ButtonIconName;
  badge?: number | string;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function TabButton({
  label,
  selected,
  onPress,
  icon,
  badge,
  disabled = false,
  testID,
  style
}: TabButtonProps) {
  const theme = useAppTheme();
  const colors = selectedTabColors(theme, selected);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        buttonStyles.tab,
        { backgroundColor: colors.backgroundColor, borderColor: colors.borderColor },
        pressed && !disabled && buttonStyles.pressed,
        disabled && buttonStyles.disabled,
        style
      ]}
    >
      {icon ? <Ionicons name={icon} size={17} color={colors.textColor} /> : null}
      <Text numberOfLines={1} style={[buttonStyles.tabLabel, { color: colors.textColor }]}>
        {label}
      </Text>
      {badge !== undefined ? (
        <View style={[buttonStyles.badge, { backgroundColor: selected ? theme.colors.surface : theme.colors.primary }]}>
          <Text style={[buttonStyles.badgeText, { color: selected ? theme.colors.primary : theme.colors.surface }]}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
