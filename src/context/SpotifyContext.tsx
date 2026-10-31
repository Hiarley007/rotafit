import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/lib/secureStore';
import {
  SPOTIFY_SCOPES,
  spotifyAppRedirectUri,
  spotifyClientId,
  spotifyDiscovery,
  spotifyRedirectUri,
} from '@/lib/spotify';
import type { SpotifyTokens } from '@/types';
const STORE_KEY = 'rotafit.spotify.tokens';
interface SpotifyContextValue {
  tokens: SpotifyTokens | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getValidAccessToken: () => Promise<string | null>;
}
const SpotifyContext = createContext<SpotifyContextValue | undefined>(undefined);
WebBrowser.maybeCompleteAuthSession();
async function saveTokens(tokens: SpotifyTokens) {
  await setSecureItem(STORE_KEY, JSON.stringify(tokens));
}
async function loadTokens(): Promise<SpotifyTokens | null> {
  const raw = await getSecureItem(STORE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SpotifyTokens;
  } catch {
    return null;
  }
}
// Login e controle de sessão do Spotify. Usa PKCE (sem client secret) e guarda
// os tokens no SecureStore do aparelho — são credenciais de terceiro, mais
// sensíveis que uma preferência qualquer, por isso não vão no AsyncStorage.
export function SpotifyProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<SpotifyTokens | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshing = useRef<Promise<string | null> | null>(null);
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: spotifyClientId,
      scopes: SPOTIFY_SCOPES,
      redirectUri: spotifyRedirectUri,
      usePKCE: true,
    },
    spotifyDiscovery,
  );
  const exchangeAuthorizationCode = useCallback(
    async (code: string, codeVerifier: string) => {
      try {
        const result = await AuthSession.exchangeCodeAsync(
          {
            clientId: spotifyClientId,
            code,
            redirectUri: spotifyRedirectUri,
            extraParams: { code_verifier: codeVerifier },
          },
          spotifyDiscovery,
        );
        const next: SpotifyTokens = {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken ?? '',
          expiresAt: Date.now() + (result.expiresIn ?? 3600) * 1000,
        };
        await saveTokens(next);
        setTokens(next);
        setError(null);
      } catch (reason) {
        const message =
          reason instanceof Error
            ? reason.message
            : 'Não foi possível conectar ao Spotify.';
        setError(`${message} Callback enviado: ${spotifyRedirectUri}`);
      } finally {
        setConnecting(false);
      }
    },
    [],
  );
  useEffect(() => {
    loadTokens().then(setTokens);
  }, []);
  useEffect(() => {
    if (!response) return;
    if (response.type !== 'success') {
      if (response?.type === 'error') {
        setError(
          `${response.error?.message ?? 'A autorização do Spotify falhou.'} Callback enviado: ${spotifyRedirectUri}`,
        );
        setConnecting(false);
      } else if (response?.type === 'cancel' || response?.type === 'dismiss') {
        setConnecting(false);
      }
      return;
    }
    const codeVerifier = request?.codeVerifier;
    if (!codeVerifier) {
      setError('Não foi possível concluir a autorização do Spotify. Tente novamente.');
      setConnecting(false);
      return;
    }
    setConnecting(true);
    void exchangeAuthorizationCode(response.params.code, codeVerifier);
  }, [response, request, exchangeAuthorizationCode]);
  const connect = useCallback(async () => {
    if (!spotifyClientId) {
      setError('Configure EXPO_PUBLIC_SPOTIFY_CLIENT_ID para conectar o Spotify.');
      return;
    }
    if (!request) {
      setError('Aguarde um instante e tente conectar novamente.');
      return;
    }
    setError(null);
    setConnecting(true);
    try {
      if (Platform.OS !== 'web') {
        if (!request.url || !request.codeVerifier) {
          throw new Error(
            'A autorização do Spotify ainda está sendo preparada. Tente novamente.',
          );
        }
        const result = await WebBrowser.openAuthSessionAsync(
          request.url,
          spotifyAppRedirectUri,
        );
        if (result.type === 'success') {
          const authResponse = request.parseReturnUrl(result.url);
          if (authResponse.type === 'success') {
            await exchangeAuthorizationCode(
              authResponse.params.code,
              request.codeVerifier,
            );
          } else {
            setError(
              `${authResponse.type === 'error' ? authResponse.error?.message : 'A autorização do Spotify foi cancelada.'} Callback enviado: ${spotifyRedirectUri}`,
            );
            setConnecting(false);
          }
        } else {
          setConnecting(false);
        }
        return;
      }
      const result = await promptAsync();
      if (result.type !== 'success') setConnecting(false);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Não foi possível abrir o Spotify.',
      );
      setConnecting(false);
    }
  }, [exchangeAuthorizationCode, promptAsync, request]);
  const disconnect = useCallback(async () => {
    await deleteSecureItem(STORE_KEY);
    setTokens(null);
    setError(null);
  }, []);
  // Renova o token de acesso quando falta menos de um minuto para expirar, e
  // devolve um token pronto para uso (ou null, se não há conta conectada).
  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    if (!tokens) return null;
    if (tokens.expiresAt - Date.now() > 60_000) return tokens.accessToken;
    if (!refreshing.current) {
      refreshing.current = AuthSession.refreshAsync(
        { clientId: spotifyClientId, refreshToken: tokens.refreshToken },
        spotifyDiscovery,
      )
        .then(async (result) => {
          const next: SpotifyTokens = {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken ?? tokens.refreshToken,
            expiresAt: Date.now() + (result.expiresIn ?? 3600) * 1000,
          };
          await saveTokens(next);
          setTokens(next);
          return next.accessToken;
        })
        .catch(async () => {
          // Refresh token revogado ou expirado: peça para conectar de novo.
          await disconnect();
          return null;
        })
        .finally(() => {
          refreshing.current = null;
        });
    }
    return refreshing.current;
  }, [tokens, disconnect]);
  const value = useMemo(
    () => ({ tokens, connecting, error, connect, disconnect, getValidAccessToken }),
    [tokens, connecting, error, connect, disconnect, getValidAccessToken],
  );
  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>;
}
export function useSpotify(): SpotifyContextValue {
  const context = useContext(SpotifyContext);
  if (!context) throw new Error('useSpotify deve ser usado dentro de <SpotifyProvider>');
  return context;
}
