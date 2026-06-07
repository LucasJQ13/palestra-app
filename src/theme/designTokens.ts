import { palette } from './palette';
import { themePresets } from './themes';

export const designTokens = {
  color: {
    appBackground: '#F4FAFB',
    appBackgroundTint: '#EAF6F8',
    surface: palette.white,
    surfaceSoft: '#F7FBFC',
    surfaceMuted: '#EEF7FA',
    border: 'rgba(23, 55, 71, 0.10)',
    borderStrong: 'rgba(45, 141, 200, 0.20)',
    overlay: 'rgba(12, 25, 38, 0.46)',
    primary: palette.red,
    primarySoft: 'rgba(45, 141, 200, 0.10)',
    text: palette.ink,
    muted: palette.inkMuted,
    danger: '#B93232',
    darkSurface: themePresets.dark.colors.surface,
    darkSurfaceSoft: themePresets.dark.colors.surfaceSoft,
    darkBorder: themePresets.dark.colors.border
  },
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    pill: 999
  },
  space: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24
  },
  font: {
    eyebrow: 11,
    caption: 12,
    body: 14,
    button: 15,
    title: 20,
    hero: 28
  },
  shadow: {
    none: {
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0
    },
    soft: {
      shadowColor: palette.blueDeep,
      shadowOpacity: 0.07,
      shadowRadius: 14,
      elevation: 1
    },
    raised: {
      shadowColor: palette.blueDeep,
      shadowOpacity: 0.14,
      shadowRadius: 20,
      elevation: 4
    },
    modal: {
      shadowColor: palette.blueDeep,
      shadowOpacity: 0.18,
      shadowRadius: 26,
      elevation: 10
    }
  }
};
