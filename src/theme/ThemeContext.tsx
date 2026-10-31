import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Appearance } from 'react-native';
import { darkTheme, lightTheme } from './tokens';
import type { ThemeTokens } from './tokens';
export type ThemePreference = 'light' | 'dark';
const STORAGE_KEY = 'rotafit.theme-preference';
interface ThemeContextValue {
  theme: ThemeTokens;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
}
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
// Tema claro ou escuro salvo no aparelho.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('light');
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') {
          setPreferenceState(saved);
          return;
        }
        if (saved === 'system') {
          const migrated = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
          setPreferenceState(migrated);
          AsyncStorage.setItem(STORAGE_KEY, migrated).catch(() => undefined);
        }
      })
      .catch(() => undefined);
  }, []);
  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => undefined);
  };
  const theme = preference === 'dark' ? darkTheme : lightTheme;
  const value = useMemo(
    () => ({ theme, preference, setPreference }),
    [theme, preference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>');
  return context;
}
