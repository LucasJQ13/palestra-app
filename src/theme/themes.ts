import { palette } from './palette';

export type ThemeName = 'default' | 'dark' | 'cordoba' | 'salta' | 'jujuy' | 'catamarca' | 'san_luis' | 'tucuman';

export type AppTheme = {
  name: ThemeName;
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    surfaceSoft: string;
    text: string;
    muted: string;
    border: string;
    accent: string;
    danger: string;
  };
};

export const themePresets: Record<ThemeName, AppTheme> = {
  default: {
    name: 'default',
    mode: 'light',
    colors: {
      primary: palette.red,
      secondary: palette.blueDeep,
      background: palette.paper,
      surface: palette.white,
      surfaceSoft: '#F6FBFC',
      text: palette.ink,
      muted: palette.inkMuted,
      border: 'rgba(45, 141, 200, 0.16)',
      accent: palette.gold,
      danger: '#B93232'
    }
  },
  dark: {
    name: 'dark',
    mode: 'dark',
    colors: {
      primary: '#2D8DC8',
      secondary: '#5DA7DB',
      background: '#081923',
      surface: '#102734',
      surfaceSoft: '#163746',
      text: '#F6FBFC',
      muted: '#A9C5D1',
      border: 'rgba(230, 243, 245, 0.16)',
      accent: '#F2B84B',
      danger: '#FF8A8A'
    }
  },
  cordoba: { name: 'cordoba', mode: 'light', colors: themePresetsBase('#2D8DC8', '#1F5F84') },
  salta: { name: 'salta', mode: 'light', colors: themePresetsBase('#2EA876', '#1F5F84') },
  jujuy: { name: 'jujuy', mode: 'light', colors: themePresetsBase('#D44A4A', '#1F5F84') },
  catamarca: { name: 'catamarca', mode: 'light', colors: themePresetsBase('#7A5BB7', '#1F5F84') },
  san_luis: { name: 'san_luis', mode: 'light', colors: themePresetsBase('#2E8B57', '#1F5F84') },
  tucuman: { name: 'tucuman', mode: 'light', colors: themePresetsBase('#F2B84B', '#1F5F84') }
};

function themePresetsBase(primary: string, secondary: string): AppTheme['colors'] {
  return {
    primary,
    secondary,
    background: palette.paper,
    surface: palette.white,
    surfaceSoft: palette.whiteSoft,
    text: palette.ink,
    muted: palette.inkMuted,
    border: palette.line,
    accent: palette.gold,
    danger: '#B93232'
  };
}
