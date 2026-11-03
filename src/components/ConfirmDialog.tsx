import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { radius, spacing, useTheme } from '@/theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive = false,
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const { theme } = useTheme();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <GlassSurface
          tint={theme.glass}
          radius={radius.lg}
          intensity={50}
          style={styles.card}
        >
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.muted }]}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              disabled={busy}
              style={[styles.button, styles.cancel, { borderColor: theme.muted }]}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy }}
              onPress={onConfirm}
              disabled={busy}
              style={[
                styles.button,
                { backgroundColor: destructive ? theme.danger : theme.primary },
                busy && styles.disabled,
              ]}
            >
              <Text style={[styles.buttonText, { color: theme.onPrimary }]}>
                {busy ? 'Aguarde...' : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </GlassSurface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '800' },
  message: { fontSize: 15, lineHeight: 22 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancel: { borderWidth: 1 },
  buttonText: { fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.55 },
});
