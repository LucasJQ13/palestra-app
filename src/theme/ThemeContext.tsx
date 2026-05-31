import React from 'react';
import { AppTheme, themePresets } from './themes';

export const AppThemeContext = React.createContext<AppTheme>(themePresets.default);

export function useAppTheme() {
  return React.useContext(AppThemeContext);
}

export function useIsDarkTheme() {
  return useAppTheme().mode === 'dark';
}
