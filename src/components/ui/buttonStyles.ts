import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import type { AppTheme } from '../../theme/themes';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerGhost';
export type ButtonSize = 'compact' | 'standard' | 'prominent';
export type IconButtonSize = 'sm' | 'md' | 'lg';

type ButtonColors = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

const sizeMetrics: Record<ButtonSize, { minHeight: number; paddingHorizontal: number; fontSize: number; iconSize: number; radius: number }> = {
  compact: { minHeight: 36, paddingHorizontal: 10, fontSize: 12, iconSize: 16, radius: 8 },
  standard: { minHeight: 44, paddingHorizontal: 14, fontSize: 14, iconSize: 18, radius: 12 },
  prominent: { minHeight: 52, paddingHorizontal: 18, fontSize: 15, iconSize: 20, radius: 16 }
};

export const iconButtonMetrics: Record<IconButtonSize, { dimension: number; iconSize: number; radius: number }> = {
  sm: { dimension: 32, iconSize: 16, radius: 8 },
  md: { dimension: 40, iconSize: 19, radius: 12 },
  lg: { dimension: 48, iconSize: 22, radius: 16 }
};

export const buttonStyles = StyleSheet.create({
  base: {
    maxWidth: '100%',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%'
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minWidth: 0
  },
  label: {
    fontWeight: '800',
    textAlign: 'center',
    flexShrink: 1
  },
  pressed: {
    opacity: 0.78
  },
  disabled: {
    opacity: 0.5
  },
  iconButton: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  floating: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    zIndex: 20,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7
  },
  floatingExtended: {
    minWidth: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8
  },
  tab: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    flexShrink: 1
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900'
  },
  group: {
    gap: 8,
    alignItems: 'center'
  },
  groupHorizontal: {
    flexDirection: 'row'
  },
  groupVertical: {
    flexDirection: 'column',
    alignItems: 'stretch'
  },
  groupWrap: {
    flexWrap: 'wrap'
  }
});

export function buttonContainerStyle(size: ButtonSize): ViewStyle {
  const metrics = sizeMetrics[size];
  return {
    minHeight: metrics.minHeight,
    paddingHorizontal: metrics.paddingHorizontal,
    paddingVertical: size === 'compact' ? 6 : 9,
    borderRadius: metrics.radius
  };
}

export function buttonTextStyle(size: ButtonSize, color: string): TextStyle {
  return {
    color,
    fontSize: sizeMetrics[size].fontSize
  };
}

export function buttonIconSize(size: ButtonSize) {
  return sizeMetrics[size].iconSize;
}

export function buttonColors(theme: AppTheme, variant: ButtonVariant): ButtonColors {
  if (variant === 'primary') {
    return {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      textColor: theme.mode === 'dark' ? theme.colors.background : theme.colors.surface
    };
  }
  if (variant === 'danger') {
    return {
      backgroundColor: theme.colors.danger,
      borderColor: theme.colors.danger,
      textColor: theme.mode === 'dark' ? theme.colors.background : theme.colors.surface
    };
  }
  if (variant === 'dangerGhost') {
    return {
      backgroundColor: 'transparent',
      borderColor: theme.colors.danger,
      textColor: theme.colors.danger
    };
  }
  if (variant === 'ghost') {
    return {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: theme.colors.primary
    };
  }
  return {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    textColor: theme.colors.primary
  };
}

export function selectedTabColors(theme: AppTheme, selected: boolean): ButtonColors {
  if (selected) {
    return {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      textColor: theme.mode === 'dark' ? theme.colors.background : theme.colors.surface
    };
  }
  return {
    backgroundColor: theme.colors.surfaceSoft,
    borderColor: theme.colors.border,
    textColor: theme.colors.text
  };
}
