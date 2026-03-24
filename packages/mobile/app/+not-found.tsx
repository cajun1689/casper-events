import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "@/hooks/useAppTheme";
import { spacing, typography } from "@/theme";

export default function NotFoundScreen() {
  const theme = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle-outline" size={56} color={theme.textTertiary} />
        <Text style={[styles.title, { color: theme.text }]}>Page not found</Text>
        <Link href="/" style={[styles.link, { color: theme.tint }]}>
          Go to home screen
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.headline,
  },
  link: {
    ...typography.body,
    fontWeight: "600",
    marginTop: spacing.sm,
  },
});
