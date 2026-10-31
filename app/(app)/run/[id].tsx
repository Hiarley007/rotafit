import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RoutePath } from '@/components/RoutePath';
import { Screen } from '@/components/Screen';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { useDeleteRun, useRun } from '@/hooks/useRuns';
import { spacing, useTheme } from '@/theme';
import {
  estimateCalories,
  formatDistance,
  formatDuration,
  formatPace,
} from '@/utils/geo';
import { friendlyError } from '@/utils/errors';
function formatFullDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
}
export default function RunDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { data: run, isLoading, isError, error, refetch } = useRun(id);
  const del = useDeleteRun();
  if (isLoading) return <LoadingView />;
  if (isError || !run)
    return <ErrorState message={friendlyError(error)} onRetry={refetch} />;
  async function confirmDelete() {
    if (!run) return;
    setDeleteError(null);
    try {
      await del.mutateAsync(run.id);
      setConfirmingDelete(false);
      router.replace('/history');
    } catch (reason) {
      setDeleteError(friendlyError(reason));
      setConfirmingDelete(false);
    }
  }
  return (
    <Screen scroll edges={['bottom', 'left', 'right']}>
      <Text style={[styles.date, { color: theme.muted }]}>
        {formatFullDate(run.startedAt)}
      </Text>
      <Text style={[styles.distance, { color: theme.text }]}>
        {formatDistance(run.distanceMeters)}
      </Text>
      <Card style={styles.mapCard}>
        <RoutePath route={run.route} height={220} />
      </Card>
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <Stat label="Tempo" value={formatDuration(run.durationSeconds)} />
          <Stat label="Ritmo médio" value={formatPace(run.avgPaceSecPerKm)} />
          <Stat
            label="Calorias"
            value={`${estimateCalories(run.distanceMeters, run.durationSeconds)} kcal`}
          />
        </View>
      </Card>
      {run.spotifyTrackName ? (
        <Card style={styles.trackCard}>
          <Ionicons name="musical-notes" size={20} color={theme.primary} />
          <Text style={[styles.track, { color: theme.text }]} numberOfLines={1}>
            {run.spotifyTrackName}
          </Text>
        </Card>
      ) : null}
      <Button
        title="Excluir corrida"
        variant="danger"
        onPress={() => setConfirmingDelete(true)}
        loading={del.isPending}
        style={styles.deleteBtn}
      />
      {deleteError ? (
        <Text style={[styles.deleteError, { color: theme.danger }]}>{deleteError}</Text>
      ) : null}
      <ConfirmDialog
        visible={confirmingDelete}
        title="Excluir corrida"
        message="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        busy={del.isPending}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => void confirmDelete()}
      />
    </Screen>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  date: { fontSize: 14 },
  distance: { fontSize: 36, fontWeight: '800', marginBottom: spacing.md },
  mapCard: { padding: 0, overflow: 'hidden', marginBottom: spacing.md },
  statsCard: { marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  track: { flex: 1, fontSize: 14, fontWeight: '600' },
  deleteBtn: { marginTop: spacing.sm },
  deleteError: { textAlign: 'center', marginTop: spacing.sm },
});
