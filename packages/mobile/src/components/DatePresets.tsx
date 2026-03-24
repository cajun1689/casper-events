import { ScrollView, Pressable, Text, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/src/hooks/useAppTheme";
import { colors, spacing, radii, typography } from "@/src/theme";
import {
  startOfDay,
  endOfDay,
  addDays,
  nextSaturday,
  nextSunday,
  isSaturday,
  isSunday,
  format,
} from "date-fns";

export interface DateRange {
  startAfter?: string;
  startBefore?: string;
}

export type PresetKey =
  | "all"
  | "today"
  | "tomorrow"
  | "weekend"
  | "week";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "weekend", label: "This Weekend" },
  { key: "week", label: "Next 7 Days" },
];

export function getDateRange(key: PresetKey): DateRange {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString();

  switch (key) {
    case "today":
      return { startAfter: fmt(startOfDay(now)), startBefore: fmt(endOfDay(now)) };
    case "tomorrow": {
      const tom = addDays(now, 1);
      return { startAfter: fmt(startOfDay(tom)), startBefore: fmt(endOfDay(tom)) };
    }
    case "weekend": {
      const sat = isSaturday(now)
        ? startOfDay(now)
        : isSunday(now)
          ? startOfDay(now)
          : startOfDay(nextSaturday(now));
      const sun = isSunday(now)
        ? endOfDay(now)
        : isSaturday(now)
          ? endOfDay(addDays(now, 1))
          : endOfDay(nextSunday(now));
      return { startAfter: fmt(sat), startBefore: fmt(sun) };
    }
    case "week":
      return { startAfter: fmt(startOfDay(now)), startBefore: fmt(endOfDay(addDays(now, 6))) };
    default:
      return {};
  }
}

interface DatePresetsProps {
  selected: PresetKey;
  onSelect: (key: PresetKey) => void;
}

export function DatePresets({ selected, onSelect }: DatePresetsProps) {
  const theme = useAppTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {PRESETS.map(({ key, label }) => {
        const active = selected === key;
        return (
          <Pressable
            key={key}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(key);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary[600] : theme.surfaceSecondary,
              },
            ]}
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[
                styles.chipText,
                { color: active ? colors.white : theme.textSecondary },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  chipText: {
    ...typography.callout,
    fontWeight: "600",
  },
});
