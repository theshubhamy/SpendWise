/**
 * Theme system - Dynamic theming with light/dark/system modes
 */

import { useColorScheme } from 'react-native';
import { Storage } from '@/utils/storage';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@/constants';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  card: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Secondary colors
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;

  // Accent colors
  accent: string;
  accentLight: string;

  // Status colors
  success: string;
  error: string;
  warning: string;
  info: string;

  // Border colors
  border: string;
  borderLight: string;

  // Shadow colors
  shadow: string;

  // Input colors
  inputBackground: string;
  inputBorder: string;
  placeholder: string;
}

const lightTheme: ThemeColors = {
  background: '#ffffff',
  surface: '#ffffff',
  card: '#ffffff',

  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',

  primary: '#007AFF',
  primaryLight: '#5AC8FA',
  primaryDark: '#0051D5',

  secondary: '#5856D6',
  secondaryLight: '#AF52DE',
  secondaryDark: '#3634A3',

  accent: '#FF3B30',
  accentLight: '#FF6B6B',

  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#007AFF',

  border: '#e0e0e0',
  borderLight: '#f0f0f0',

  shadow: '#000000',

  inputBackground: '#ffffff',
  inputBorder: '#e0e0e0',
  placeholder: '#999999',
};

const darkTheme: ThemeColors = {
  background: '#000000',
  surface: '#1c1c1e',
  card: '#2c2c2e',

  text: '#ffffff',
  textSecondary: '#a0a0a0',
  textTertiary: '#707070',

  primary: '#0A84FF',
  primaryLight: '#5AC8FA',
  primaryDark: '#0051D5',

  secondary: '#5E5CE6',
  secondaryLight: '#BF5AF2',
  secondaryDark: '#3D3AB8',

  accent: '#FF453A',
  accentLight: '#FF6B6B',

  success: '#32D74B',
  error: '#FF453A',
  warning: '#FF9F0A',
  info: '#0A84FF',

  border: '#38383a',
  borderLight: '#2c2c2e',

  shadow: '#000000',

  inputBackground: '#2c2c2e',
  inputBorder: '#38383a',
  placeholder: '#707070',
};

/**
 * Get current theme mode from storage
 */
export const getThemeMode = (): ThemeMode => {
  const theme = Storage.getString(STORAGE_KEYS.THEME);
  return (theme as ThemeMode) || DEFAULT_SETTINGS.THEME;
};

/**
 * Set theme mode
 */
export const setThemeMode = (mode: ThemeMode): void => {
  Storage.setString(STORAGE_KEYS.THEME, mode);
};

/**
 * Get theme colors based on mode
 */
export const getThemeColors = (
  mode: ThemeMode,
  systemColorScheme: 'light' | 'dark' | null | undefined | 'unspecified',
): ThemeColors => {
  if (mode === 'system') {
    return systemColorScheme === 'dark' ? darkTheme : lightTheme;
  }
  return mode === 'dark' ? darkTheme : lightTheme;
};

/**
 * Hook to get current theme colors
 */
export const useTheme = (): ThemeColors => {
  const systemColorScheme = useColorScheme();
  const themeMode = getThemeMode();

  return getThemeColors(themeMode, systemColorScheme || null);
};

/**
 * Hook to get theme mode
 */
export const useThemeMode = (): ThemeMode => {
  return getThemeMode();
};
