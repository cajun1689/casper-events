import { ScrollView, Pressable, Text, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/hooks/useAppTheme";
import { spacing, radii, typography } from "@/theme";
import type { CategoryPublic } from "@cyh/shared";

interface CategoryPillsProps {
  categories: CategoryPublic[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function CategoryPills({
  categories,
  selected,
  onToggle,
}: CategoryPillsProps) {
  const theme = useAppTheme();

  if (categories.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((cat) => {
        const active = selected.has(cat.id);
        const catColor = cat.color || theme.tint;
        return (
          <Pressable
            key={cat.id}
            onPress={() => {
              Haptics.selectionAsync();
              onToggle(cat.id);
            }}
            style={[
              styles.pill,
              {
                backgroundColor: active
                  ? catColor
                  : hexToRgba(catColor, 0.1),
              },
            ]}
            accessibilityLabel={`${cat.name} category`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[
                styles.pillText,
                { color: active ? "#fff" : catColor },
              ]}
            >
              {cat.name}
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
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  pillText: {
    ...typography.caption,
    fontWeight: "600",
  },
});
