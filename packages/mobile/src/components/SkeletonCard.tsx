import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useAppTheme } from "@/src/hooks/useAppTheme";
import { spacing, radii, shadows } from "@/src/theme";

export function SkeletonCard() {
  const theme = useAppTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  const bone = (width: number | string, height: number, mb = 0) => (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radii.sm,
          backgroundColor: theme.skeleton,
          marginBottom: mb,
          opacity,
        },
      ]}
    />
  );

  return (
    <View
      style={[
        styles.card,
        shadows.sm,
        { backgroundColor: theme.cardBackground },
      ]}
    >
      {bone("100%", 180, spacing.md)}
      <View style={styles.content}>
        {bone("70%", 14, spacing.sm)}
        {bone("100%", 18, spacing.sm)}
        {bone("60%", 12, spacing.xs)}
        <View style={styles.tagRow}>
          {bone(60, 20)}
          {bone(50, 20)}
        </View>
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    overflow: "hidden",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  content: {
    padding: spacing.md,
  },
  tagRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  list: {
    paddingTop: spacing.lg,
  },
});
