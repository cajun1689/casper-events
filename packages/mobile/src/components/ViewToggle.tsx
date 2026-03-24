import { StyleSheet, View, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/hooks/useAppTheme";
import { colors, spacing, radii, typography } from "@/theme";

export type ViewMode = "cards" | "list" | "poster" | "calendar" | "map";

const MODES: { key: ViewMode; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: "cards", icon: "grid-outline", label: "Cards" },
  { key: "list", icon: "list-outline", label: "List" },
  { key: "poster", icon: "color-palette-outline", label: "Poster" },
  { key: "calendar", icon: "calendar-outline", label: "Cal" },
  { key: "map", icon: "map-outline", label: "Map" },
];

interface ViewToggleProps {
  selected: ViewMode;
  onSelect: (mode: ViewMode) => void;
}

export function ViewToggle({ selected, onSelect }: ViewToggleProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceSecondary }]}>
      {MODES.map(({ key, icon, label }) => {
        const active = selected === key;
        return (
          <Pressable
            key={key}
            onPress={() => {
              if (key !== selected) {
                Haptics.selectionAsync();
                onSelect(key);
              }
            }}
            style={[
              styles.segment,
              active && [styles.segmentActive, { backgroundColor: theme.surface }],
            ]}
            accessibilityLabel={`${label} view`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Ionicons
              name={icon}
              size={16}
              color={active ? colors.primary[600] : theme.textTertiary}
            />
            <Text
              style={[
                styles.label,
                { color: active ? colors.primary[600] : theme.textTertiary },
                active && styles.labelActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: radii.lg,
    padding: 3,
    marginHorizontal: spacing.lg,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  segmentActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    ...typography.caption,
    fontWeight: "500",
  },
  labelActive: {
    fontWeight: "600",
  },
});
