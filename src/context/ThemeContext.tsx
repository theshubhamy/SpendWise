/**
 * Theme Context - Provides theme throughout the app
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import {
  ThemeColors,
  ThemeMode,
  getThemeMode,
  setThemeMode,
  getThemeColors,
} from '@/theme';

interface ThemeContextType {
  colors: ThemeColors;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(getThemeMode());

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    setThemeMode(newMode);
  };

  const colors = getThemeColors(mode, systemColorScheme);
  const isDark =
    mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');

  return (
    <ThemeContext.Provider value={{ colors, mode, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
};
