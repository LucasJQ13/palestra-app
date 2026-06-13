import React, { ComponentProps } from 'react';
import { ActivityIndicator, GestureResponderEvent, Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  buttonColors,
  buttonContainerStyle,
  buttonIconSize,
  buttonStyles,
  buttonTextStyle
} from './buttonStyles';
import type { ButtonSize, ButtonVariant } from './buttonStyles';

export type ButtonIconName = ComponentProps<typeof Ionicons>['name'];

export type AppButtonProps = {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ButtonIconName;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'standard',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
  textStyle
}: AppButtonProps) {
  const theme = useAppTheme();
  const colors = buttonColors(theme, variant);
  const isDisabled = disabled || loading;
  const contentIcon = loading ? (
    <ActivityIndicator size="small" color={colors.textColor} />
  ) : icon ? (
    <Ionicons name={icon} size={buttonIconSize(size)} color={colors.textColor} />
  ) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        buttonStyles.base,
        buttonContainerStyle(size),
        { backgroundColor: colors.backgroundColor, borderColor: colors.borderColor },
        fullWidth && buttonStyles.fullWidth,
        pressed && !isDisabled && buttonStyles.pressed,
        isDisabled && buttonStyles.disabled,
        style
      ]}
    >
      <View style={buttonStyles.content}>
        {iconPosition === 'left' ? contentIcon : null}
        <Text numberOfLines={2} style={[buttonStyles.label, buttonTextStyle(size, colors.textColor), textStyle]}>
          {label}
        </Text>
        {iconPosition === 'right' ? contentIcon : null}
      </View>
    </Pressable>
  );
}
