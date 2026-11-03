import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { radius, spacing, useTheme } from '@/theme';
import type { ThemePreference } from '@/theme';
const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];
// Alternância visual simples entre as duas paletas esportivas.
export function ThemePicker() {
  const { theme, preference, setPreference } = useTheme();
  return (
    <GlassSurface radius={radius.pill} style={styles.wrap} intensity={20}>
      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const selected = opt.value === preference;
          const icon = opt.value === 'light' ? 'sunny' : 'moon';
          return (
            <Pressable
              key={opt.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setPreference(opt.value)}
              style={[styles.segment, selected && { backgroundColor: theme.primary }]}
            >
              <Ionicons
                name={icon}
                size={18}
                color={selected ? theme.onPrimary : theme.secondary}
              />
              <Text
                style={[styles.label, { color: selected ? theme.onPrimary : theme.text }]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </GlassSurface>
  );
}
const styles = StyleSheet.create({
  wrap: { padding: 4 },
  row: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  label: { fontSize: 14, fontWeight: '700' },
});
