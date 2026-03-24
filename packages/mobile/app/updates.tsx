import { ScrollView, Text, View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "@/src/hooks/useAppTheme";
import { colors, spacing, radii, shadows, typography } from "@/src/theme";

function FeatureItem({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const theme = useAppTheme();
  return (
    <View style={featureStyles.row}>
      <View style={[featureStyles.iconWrap, { backgroundColor: `${colors.primary[600]}14` }]}>
        <Ionicons name={icon} size={16} color={colors.primary[600]} />
      </View>
      <Text style={[featureStyles.text, { color: theme.text }]}>{text}</Text>
    </View>
  );
}

const featureStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    ...typography.body,
    flex: 1,
  },
});

export default function UpdatesScreen() {
  const theme = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Updates" }} />
      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.card, shadows.sm, { backgroundColor: theme.surface }]}>
          <Text style={[styles.heading, { color: theme.text }]}>What's New</Text>
          <Text style={[styles.para, { color: theme.textSecondary }]}>
            Wyoming Events Calendar brings events from across the state to your
            device. Filter by city, get push reminders, and discover your community.
          </Text>
        </View>

        <View style={[styles.card, shadows.sm, { backgroundColor: theme.surface }]}>
          <Text style={[styles.heading, { color: theme.text }]}>Recent Features</Text>
          <FeatureItem icon="location" text="City filter: see events in your city" />
          <FeatureItem icon="notifications" text="Push notifications 1.5 hours before events" />
          <FeatureItem icon="people" text="Browse organizations and their events" />
          <FeatureItem icon="search" text="Search events by name" />
          <FeatureItem icon="calendar" text="Filter by date and category" />
          <FeatureItem icon="share" text="Share events and add to calendar" />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing["4xl"] },
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  heading: {
    ...typography.headline,
    marginBottom: spacing.md,
  },
  para: {
    ...typography.body,
    lineHeight: 22,
  },
});
