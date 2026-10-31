import Constants from 'expo-constants';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ThemePicker } from '@/components/ThemePicker';
import { useAuth } from '@/context/AuthContext';
import { useSpotify } from '@/context/SpotifyContext';
import { spotifyRedirectUri } from '@/lib/spotify';
import { spacing, useTheme } from '@/theme';
export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const { tokens, connect, disconnect, connecting, error: spotifyError } = useSpotify();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const name = String(user?.user_metadata?.full_name ?? 'Usuário');
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      setConfirmSignOut(false);
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Não foi possível sair.');
      setConfirmSignOut(false);
    } finally {
      setSigningOut(false);
    }
  }
  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text, marginTop: spacing.xl }]}>
        Perfil
      </Text>
      <Card style={styles.card}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={[styles.avatarText, { color: theme.onPrimary }]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
        <Text style={[styles.email, { color: theme.muted }]}>{user?.email}</Text>
      </Card>
      <Text style={[styles.sectionTitle, { color: theme.muted }]}>APARÊNCIA</Text>
      <ThemePicker />
      <Text style={[styles.sectionTitle, { color: theme.muted }]}>SPOTIFY</Text>
      <Card style={styles.card}>
        {tokens ? (
          <>
            <Text style={{ color: theme.text, marginBottom: spacing.sm }}>
              Conta conectada.
            </Text>
            <Button title="Desconectar Spotify" variant="ghost" onPress={disconnect} />
          </>
        ) : (
          <Button
            title={connecting ? 'Conectando...' : 'Conectar Spotify'}
            onPress={() => void connect()}
            disabled={connecting}
          />
        )}
        {spotifyError ? (
          <Text style={{ color: theme.danger, textAlign: 'center' }}>{spotifyError}</Text>
        ) : null}
        <Text
          selectable
          style={{ color: theme.muted, fontSize: 11, textAlign: 'center' }}
        >
          URI de retorno usada: {spotifyRedirectUri}
        </Text>
      </Card>
      {signOutError ? (
        <Text style={{ color: theme.danger, textAlign: 'center' }}>{signOutError}</Text>
      ) : null}
      <Button
        title="Sair da conta"
        variant="danger"
        onPress={() => setConfirmSignOut(true)}
        style={styles.signOut}
      />
      <ConfirmDialog
        visible={confirmSignOut}
        title="Sair da conta"
        message="Deseja encerrar sua sessão no RotaFit?"
        confirmLabel="Sair"
        destructive
        busy={signingOut}
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => void handleSignOut()}
      />
      <Text style={[styles.version, { color: theme.muted }]}>
        RotaFit v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.md, gap: spacing.md },
  title: { fontSize: 28, fontWeight: '800', marginBottom: spacing.sm },
  card: { alignItems: 'center', gap: 2 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 30, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '700' },
  email: { fontSize: 14 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: spacing.sm,
  },
  signOut: { marginTop: spacing.md },
  version: { textAlign: 'center', fontSize: 12, marginTop: spacing.sm },
});
