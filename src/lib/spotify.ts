import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
// Descoberta manual: os endpoints do Spotify são fixos, então evitamos uma
// consulta de rede extra ao ".well-known" na hora de abrir o login.
export const spotifyDiscovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};
export const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
];
export const spotifyClientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '';
const configuredRedirectUri =
  Platform.OS === 'web'
    ? process.env.EXPO_PUBLIC_SPOTIFY_REDIRECT_URI_WEB
    : process.env.EXPO_PUBLIC_SPOTIFY_REDIRECT_URI_NATIVE;
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
const generatedRedirectUri =
  configuredRedirectUri?.trim() ||
  (Platform.OS === 'web'
    ? AuthSession.makeRedirectUri({ path: 'spotify-auth' })
    : supabaseUrl
      ? `${supabaseUrl}/functions/v1/spotify-auth`
      : AuthSession.makeRedirectUri({ scheme: 'rotafit', path: 'spotify-auth' }));
export const spotifyRedirectUri = (() => {
  if (Platform.OS !== 'web' || !__DEV__) return generatedRedirectUri;
  try {
    const uri = new URL(generatedRedirectUri);
    if (uri.hostname.toLowerCase() === 'localhost') uri.hostname = '127.0.0.1';
    return uri.toString();
  } catch {
    return generatedRedirectUri;
  }
})();
export const spotifyAppRedirectUri = AuthSession.makeRedirectUri({
  scheme: 'rotafit',
  path: 'spotify-auth',
});
// PKCE dispensa client secret: nada sensível fica embutido no app. O
// «usePKCE: true» (padrão do expo-auth-session) já cuida do code_verifier.
