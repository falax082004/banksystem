import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pasabuy_theme_mode';

const lightColors = {
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#333333',
  mutedText: '#666666',
  border: '#dddddd',
  primary: '#333333',
  danger: '#C62828',
};

const darkColors = {
  background: '#111111',
  surface: '#1C1C1E',
  text: '#F2F2F7',
  mutedText: '#A1A1AA',
  border: '#2C2C2E',
  primary: '#F2F2F7',
  danger: '#FF6B6B',
};

const ThemeContext = createContext({
  mode: 'light',
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') {
          setMode(saved);
        }
      } catch {
        // Keep default theme if read fails.
      }
    };
    load();
  }, []);

  const toggleTheme = async () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextMode);
    } catch {
      // No-op if persistence fails.
    }
  };

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === 'dark',
      colors: mode === 'dark' ? darkColors : lightColors,
      toggleTheme,
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeMode = () => useContext(ThemeContext);
