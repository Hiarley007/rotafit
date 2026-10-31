import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassSurface, glassShadow } from '@/components/glass/GlassSurface';
import { RoutePath } from '@/components/RoutePath';
import { SpotifyPlayerCard } from '@/components/spotify/SpotifyPlayerCard';
import { useNowPlaying } from '@/hooks/useSpotifyPlayer';
import { useRunTracker } from '@/hooks/useRunTracker';
import { useSaveRun } from '@/hooks/useRuns';
import { radius, spacing, useTheme } from '@/theme';
import { friendlyError } from '@/utils/errors';
import { formatDistance, formatDuration, formatPace } from '@/utils/geo';

type DialogState = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
};

// Tela cheia, sem abas, para manter os controles da corrida visíveis.
export default function ActiveRunScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const tracker = useRunTracker();
  const saveRun = useSaveRun();
  const { data: nowPlaying } = useNowPlaying();
  const [starting, setStarting] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  function showMessage(title: string, message: string, onConfirm?: () => void) {
    setDialog({
      title,
      message,
      confirmLabel: 'Entendi',
      onConfirm,
    });
  }

  useEffect(() => {
    if (!tracker.locationError) return;
    setDialog({
      title: 'Localização indisponível',
      message: tracker.locationError,
      confirmLabel: 'Entendi',
    });
  }, [tracker.locationError]);

  async function handleStart() {
    setStarting(true);

    try {
      const ok = await tracker.start();

      if (!ok) {
        showMessage(
          'Permissão de localização necessária',
          'O RotaFit precisa da sua localização para registrar a rota da corrida. Ative a permissão nas configurações do aparelho.',
        );
      }
    } catch (error) {
      showMessage('Não foi possível iniciar a corrida', friendlyError(error));
    } finally {
      setStarting(false);
    }
  }

  function finishConfirmedRun() {
    const input = tracker.finish(
      nowPlaying?.name ? `${nowPlaying.name} — ${nowPlaying.artist}` : null,
    );

    if (!input) {
      router.back();
      return;
    }

    if (input.distanceMeters === 0) {
      showMessage(
        'Corrida não salva',
        'A corrida foi encerrada, mas nenhuma distância foi registrada. Verifique se a localização está ativada e tente novamente.',
        () => router.back(),
      );
      return;
    }

    saveRun.mutate(input, {
      onSuccess: (id) => router.replace(`/run/${id}`),
      onError: (error) => {
        showMessage('Não foi possível salvar', friendlyError(error));
      },
    });
  }

  function handleFinish() {
    setDialog({
      title: 'Finalizar corrida',
      message: 'Deseja encerrar e salvar esta corrida?',
      confirmLabel: 'Finalizar',
      cancelLabel: 'Continuar correndo',
      destructive: true,
      onConfirm: finishConfirmedRun,
    });
  }

  function handleDiscard() {
    setDialog({
      title: 'Descartar corrida',
      message: 'Os dados desta corrida serão perdidos.',
      confirmLabel: 'Descartar',
      cancelLabel: 'Continuar correndo',
      destructive: true,
      onConfirm: () => {
        tracker.reset();
        router.replace('/');
      },
    });
  }

  function closeDialog() {
    setDialog(null);
  }

  function confirmDialog() {
    const action = dialog?.onConfirm;
    setDialog(null);
    action?.();
  }

  if (tracker.status === 'idle') {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="walk" size={64} color={theme.primary} />

        <Text style={[styles.readyTitle, { color: theme.text }]}>
          Pronto para começar?
        </Text>

        <Text style={[styles.readyText, { color: theme.muted }]}>
          Vamos usar sua localização para acompanhar a rota, a distância e o ritmo em
          tempo real.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={handleStart}
          disabled={starting}
          style={styles.startWrap}
        >
          <GlassSurface
            tint={theme.primary}
            radius={radius.pill}
            style={[styles.startBtn, glassShadow(theme.primary)]}
          >
            <Text style={[styles.startText, { color: theme.onPrimary }]}>
              {starting ? 'Localizando...' : 'Começar corrida'}
            </Text>
          </GlassSurface>
        </Pressable>

        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={[styles.cancel, { color: theme.muted }]}>Cancelar</Text>
        </Pressable>

        <RunDialog dialog={dialog} onCancel={closeDialog} onConfirm={confirmDialog} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <RoutePath route={tracker.route} height={280} live />

      <View style={styles.stats}>
        <GlassSurface radius={radius.lg} style={styles.statsCard} intensity={30}>
          <Stat label="Distância" value={formatDistance(tracker.distanceMeters)} big />

          <View style={styles.statsRow}>
            <Stat label="Tempo" value={formatDuration(tracker.elapsedSeconds)} />
            <Stat label="Ritmo" value={formatPace(tracker.pace)} />
          </View>
        </GlassSurface>

        <SpotifyPlayerCard />

        <View style={styles.controls}>
          {tracker.status === 'active' ? (
            <ControlButton
              icon="pause"
              label="Pausar"
              onPress={tracker.pause}
              tint={theme.primary}
            />
          ) : (
            <ControlButton
              icon="play"
              label="Retomar"
              onPress={tracker.resume}
              tint={theme.primary}
            />
          )}

          <ControlButton
            icon="stop"
            label="Finalizar"
            onPress={handleFinish}
            tint={theme.danger}
          />
        </View>

        <Pressable accessibilityRole="button" onPress={handleDiscard}>
          <Text style={[styles.discard, { color: theme.muted }]}>Descartar corrida</Text>
        </Pressable>
      </View>

      <RunDialog dialog={dialog} onCancel={closeDialog} onConfirm={confirmDialog} />
    </View>
  );
}

function RunDialog({
  dialog,
  onCancel,
  onConfirm,
}: {
  dialog: DialogState | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Modal
      transparent
      visible={dialog !== null}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <GlassSurface
          tint={theme.glass}
          radius={radius.lg}
          intensity={50}
          style={styles.dialogCard}
        >
          <Text style={[styles.dialogTitle, { color: theme.text }]}>{dialog?.title}</Text>

          <Text style={[styles.dialogMessage, { color: theme.muted }]}>
            {dialog?.message}
          </Text>

          <View style={styles.dialogActions}>
            {dialog?.cancelLabel ? (
              <Pressable
                accessibilityRole="button"
                onPress={onCancel}
                style={[
                  styles.dialogButton,
                  styles.cancelButton,
                  { borderColor: theme.muted },
                ]}
              >
                <Text style={[styles.buttonText, { color: theme.text }]}>
                  {dialog.cancelLabel}
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={[
                styles.dialogButton,
                {
                  backgroundColor: dialog?.destructive ? theme.danger : theme.primary,
                },
              ]}
            >
              <Text style={[styles.buttonText, { color: theme.onPrimary }]}>
                {dialog?.confirmLabel}
              </Text>
            </Pressable>
          </View>
        </GlassSurface>
      </View>
    </Modal>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  const { theme } = useTheme();

  return (
    <View style={styles.stat}>
      <Text style={[big ? styles.statBig : styles.statValue, { color: theme.text }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

function ControlButton({
  icon,
  label,
  onPress,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tint: string;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.controlWrap}
    >
      <GlassSurface
        tint={tint}
        radius={radius.pill}
        style={[styles.controlBtn, glassShadow(tint)]}
      >
        <Ionicons name={icon} size={28} color={theme.onPrimary} />
      </GlassSurface>

      <Text style={[styles.controlLabel, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  readyTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  readyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  startWrap: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
  startBtn: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: {
    fontSize: 17,
    fontWeight: '800',
  },
  cancel: {
    marginTop: spacing.md,
    fontSize: 15,
  },
  screen: {
    flex: 1,
  },
  stats: {
    padding: spacing.md,
    gap: spacing.md,
    marginTop: -40,
  },
  statsCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statBig: {
    fontSize: 44,
    fontWeight: '800',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.sm,
  },
  controlWrap: {
    alignItems: 'center',
    gap: 6,
  },
  controlBtn: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  discard: {
    textAlign: 'center',
    marginTop: spacing.sm,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  dialogMessage: {
    fontSize: 15,
    lineHeight: 22,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  dialogButton: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
