import React from 'react';
import { GestureResponderEvent, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import type { ButtonIconName } from './AppButton';
import { buttonColors, buttonStyles, iconButtonMetrics } from './buttonStyles';
import type { ButtonVariant, IconButtonSize } from './buttonStyles';

export type IconButtonProps = {
  icon: ButtonIconName;
  onPress: (event: GestureResponderEvent) => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  variant?: ButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  selected?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  selected = false,
  testID,
  style
}: IconButtonProps) {
  const theme = useAppTheme();
  const colors = buttonColors(theme, selected ? 'primary' : variant);
  const metrics = iconButtonMetrics[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      hitSlop={size === 'sm' ? 6 : 2}
      style={({ pressed }) => [
        buttonStyles.iconButton,
        {
          width: metrics.dimension,
          height: metrics.dimension,
          borderRadius: metrics.radius,
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor
        },
        pressed && !disabled && buttonStyles.pressed,
        disabled && buttonStyles.disabled,
        style
      ]}
    >
      <Ionicons name={icon} size={metrics.iconSize} color={colors.textColor} />
    </Pressable>
  );
}
