import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AuthProvider } from '@/context/AuthContext';
import { SpotifyProvider } from '@/context/SpotifyContext';
import { ThemeProvider, useTheme } from '@/theme';
import { queryClient } from '@/lib/queryClient';
function Chrome({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  useEffect(() => {
    if (
      Platform.OS !== 'web' ||
      !__DEV__ ||
      typeof window === 'undefined' ||
      window.location.hostname.toLowerCase() !== 'localhost'
    ) {
      return;
    }
    const url = new URL(window.location.href);
    url.hostname = '127.0.0.1';
    window.location.replace(url.toString());
  }, []);
  return (
    <>
      <StatusBar style={theme.statusBar} />
      {children}
    </>
  );
}
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SpotifyProvider>
            <Chrome>
              <Stack screenOptions={{ headerShown: false }} />
            </Chrome>
          </SpotifyProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
