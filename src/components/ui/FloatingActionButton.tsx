import React from 'react';
import { Pressable, StyleProp, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import type { ButtonIconName } from './AppButton';
import { buttonColors, buttonStyles } from './buttonStyles';

export type FloatingActionButtonProps = {
  icon: ButtonIconName;
  onPress: () => void;
  accessibilityLabel: string;
  label?: string;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function FloatingActionButton({
  icon,
  onPress,
  accessibilityLabel,
  label,
  disabled = false,
  testID,
  style
}: FloatingActionButtonProps) {
  const theme = useAppTheme();
  const colors = buttonColors(theme, 'primary');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        buttonStyles.iconButton,
        buttonStyles.floating,
        label ? buttonStyles.floatingExtended : { width: 48, height: 48 },
        {
          minHeight: 48,
          borderRadius: 16,
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          shadowColor: theme.colors.primary
        },
        pressed && !disabled && buttonStyles.pressed,
        disabled && buttonStyles.disabled,
        style
      ]}
    >
      <Ionicons name={icon} size={22} color={colors.textColor} />
      {label ? <Text style={[buttonStyles.label, { color: colors.textColor, fontSize: 14 }]}>{label}</Text> : null}
    </Pressable>
  );
}
