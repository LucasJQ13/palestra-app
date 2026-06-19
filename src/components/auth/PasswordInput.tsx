import React, { useState } from 'react';
import { StyleProp, Text, TextInput, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inputPlaceholderColor } from '../../lib/constants';
import { styles } from '../../theme/appStyles';
import { useAppTheme } from '../../theme/ThemeContext';

export type PasswordInputVariant = 'default' | 'auth';

export type PasswordInputProps = Omit<React.ComponentProps<typeof TextInput>, 'secureTextEntry'> & {
  label?: string;
  variant?: PasswordInputVariant;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

export function PasswordInput({
  label,
  variant = 'default',
  containerStyle,
  labelStyle,
  style,
  placeholderTextColor,
  autoCapitalize = 'none',
  autoCorrect = false,
  ...inputProps
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const theme = useAppTheme();
  const authVariant = variant === 'auth';
  const toggleLabel = visible ? 'Ocultar contraseña' : 'Mostrar contraseña';

  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={[
          authVariant ? styles.authInputLabel : styles.inputLabel,
          !authVariant && { color: theme.colors.text },
          labelStyle
        ]}>{label}</Text>
      ) : null}
      <View style={authVariant ? styles.authPasswordWrap : styles.passwordInputWrap}>
        <TextInput
          {...inputProps}
          style={authVariant
            ? [styles.authInputPassword, style]
            : [styles.input, styles.inputWithIcon, theme.mode === 'dark' && styles.inputDark, style]}
          secureTextEntry={!visible}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          placeholderTextColor={placeholderTextColor ?? (authVariant ? 'rgba(230,243,245,0.62)' : inputPlaceholderColor)}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={toggleLabel}
          accessibilityState={{ expanded: visible }}
          hitSlop={4}
          style={[
            authVariant ? styles.authEyeButton : styles.passwordEyeButton,
            !authVariant && { backgroundColor: theme.colors.surfaceSoft }
          ]}
          onPress={() => setVisible((current) => !current)}
          activeOpacity={0.82}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={authVariant ? '#FFFFFF' : theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
