import * as Location from 'expo-location';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { averagePaceSecPerKm, simplifyRoute } from '@/utils/geo';
import { elapsedSeconds, initialTrackerState, trackerReducer } from '@/utils/tracker';
import type { SaveRunInput } from '@/types';
// Liga o reducer puro (utils/tracker.ts) ao GPS de verdade e a um relógio de
// 1 em 1 segundo. A lógica de "o que fazer com cada evento" já está testada
// no reducer; aqui só existe o encanamento com o sensor do aparelho.
export function useRunTracker() {
  const [state, dispatch] = useReducer(trackerReducer, initialTrackerState);
  const [now, setNow] = useState(() => Date.now());
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const subscription = useRef<Location.LocationSubscription | null>(null);
  useEffect(() => {
    if (state.status !== 'active') return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.status]);
  const stopWatching = useCallback(() => {
    subscription.current?.remove();
    subscription.current = null;
  }, []);
  useEffect(() => stopWatching, [stopWatching]);
  const startWatching = useCallback(async () => {
    if (Platform.OS === 'web') {
      const geolocation = globalThis.navigator?.geolocation;
      if (!geolocation) {
        throw new Error('Este navegador não oferece suporte à localização.');
      }
      const watchId = geolocation.watchPosition(
        (loc) =>
          dispatch({
            type: 'ADD_POINT',
            now: loc.timestamp,
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          }),
        (error) => {
          stopWatching();
          dispatch({ type: 'RESET' });
          setPermissionDenied(error.code === error.PERMISSION_DENIED);
          setLocationError(
            error.code === error.PERMISSION_DENIED
              ? 'Permita o acesso à localização nas configurações do navegador e tente novamente.'
              : error.code === error.TIMEOUT
                ? 'O GPS demorou para responder. Tente novamente em uma área aberta.'
                : 'Não foi possível obter sua localização. Verifique o GPS e tente novamente.',
          );
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 },
      );
      subscription.current = { remove: () => geolocation.clearWatch(watchId) };
      return;
    }

    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (loc) =>
        dispatch({
          type: 'ADD_POINT',
          now: loc.timestamp,
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        }),
    );
    subscription.current = sub;
  }, [stopWatching]);
  const start = useCallback(async () => {
    setLocationError(null);
    setPermissionDenied(false);
    if (Platform.OS === 'web') {
      dispatch({ type: 'START', now: Date.now() });
      try {
        await startWatching();
        return true;
      } catch (error) {
        dispatch({ type: 'RESET' });
        setLocationError(
          error instanceof Error
            ? error.message
            : 'Não foi possível iniciar a localização.',
        );
        return false;
      }
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setPermissionDenied(true);
      setLocationError('Permita o acesso à localização para iniciar a corrida.');
      return false;
    }
    dispatch({ type: 'START', now: Date.now() });
    try {
      await startWatching();
      return true;
    } catch (error) {
      dispatch({ type: 'RESET' });
      setLocationError(
        error instanceof Error
          ? error.message
          : 'Não foi possível iniciar a localização.',
      );
      return false;
    }
  }, [startWatching]);
  const pause = useCallback(() => {
    stopWatching();
    dispatch({ type: 'PAUSE', now: Date.now() });
  }, [stopWatching]);
  const resume = useCallback(async () => {
    dispatch({ type: 'RESUME', now: Date.now() });
    await startWatching();
  }, [startWatching]);
  // Encerra a corrida e devolve os dados prontos para salvar no Supabase.
  const finish = useCallback(
    (spotifyTrackName: string | null): SaveRunInput | null => {
      stopWatching();
      const at = Date.now();
      dispatch({ type: 'FINISH', now: at });
      if (state.startedAt === null) return null;
      return {
        startedAt: new Date(state.startedAt).toISOString(),
        endedAt: new Date(at).toISOString(),
        distanceMeters: state.distanceMeters,
        durationSeconds: Math.round(
          elapsedSeconds({ ...state, status: 'finished', finishedAt: at }, at),
        ),
        route: simplifyRoute(state.route),
        spotifyTrackName,
      };
    },
    [state, stopWatching],
  );
  const reset = useCallback(() => {
    stopWatching();
    dispatch({ type: 'RESET' });
  }, [stopWatching]);
  const seconds = elapsedSeconds(state, now);
  return {
    status: state.status,
    route: state.route,
    distanceMeters: state.distanceMeters,
    elapsedSeconds: seconds,
    pace: averagePaceSecPerKm(state.distanceMeters, seconds),
    permissionDenied,
    locationError,
    start,
    pause,
    resume,
    finish,
    reset,
  };
}
