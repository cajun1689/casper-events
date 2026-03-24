import { ScrollView, Text, View, StyleSheet, Pressable, Linking } from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "@/src/hooks/useAppTheme";
import { colors, spacing, radii, shadows, typography } from "@/src/theme";

function FeatureItem({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const theme = useAppTheme();
  return (
    <View style={featureStyles.row}>
      <Ionicons name={icon} size={16} color={colors.primary[600]} />
      <Text style={[featureStyles.text, { color: theme.text }]}>{text}</Text>
    </View>
  );
}

const featureStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    ...typography.body,
    flex: 1,
  },
});

export default function AboutScreen() {
  const theme = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: "About" }} />
      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.card, shadows.sm, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            Wyoming Events Calendar
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            A free, open-source community event calendar for the whole state of Wyoming.
          </Text>
        </View>

        <View style={[styles.card, shadows.sm, { backgroundColor: theme.surface }]}>
          <Text style={[styles.heading, { color: theme.text }]}>Our Mission</Text>
          <Text style={[styles.para, { color: theme.textSecondary }]}>
            Wyoming Events Calendar exists to make it easy for community members
            across Wyoming to discover what's happening locally — from youth
            programs and outdoor activities to veteran services, pride events, and
            everything in between.
          </Text>
        </View>

        <View style={[styles.card, shadows.sm, { backgroundColor: theme.surface }]}>
          <Text style={[styles.heading, { color: theme.text }]}>Built by Casper Youth Hub</Text>
          <Text style={[styles.para, { color: theme.textSecondary }]}>
            Wyoming Events Calendar is built and maintained by Casper Youth Hub, a
            501(c)(3) nonprofit organization based in Casper, Wyoming. Our broader
            mission centers on youth mental health, focusing on ages 14–20.
          </Text>
        </View>

        <View style={[styles.card, shadows.sm, { backgroundColor: theme.surface }]}>
          <Text style={[styles.heading, { color: theme.text }]}>Features</Text>
          <FeatureItem icon="location" text="Browse events by city across Wyoming" />
          <FeatureItem icon="notifications" text="Push notifications for your favorite organizations" />
          <FeatureItem icon="search" text="Search and filter by category and date" />
          <FeatureItem icon="heart" text="No ads, no tracking, completely free" />
        </View>

        <View style={[styles.card, shadows.sm, { backgroundColor: theme.surface }]}>
          <Text style={[styles.heading, { color: theme.text }]}>Contact</Text>
          <Pressable
            onPress={() => Linking.openURL("mailto:hello@casperevents.org")}
            accessibilityLabel="Email hello@casperevents.org"
            accessibilityRole="link"
          >
            <View style={styles.contactRow}>
              <Ionicons name="mail" size={18} color={theme.tint} />
              <Text style={[styles.link, { color: theme.tint }]}>hello@casperevents.org</Text>
            </View>
          </Pressable>
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
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    lineHeight: 22,
  },
  heading: {
    ...typography.headline,
    marginBottom: spacing.md,
  },
  para: {
    ...typography.body,
    lineHeight: 22,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  link: {
    ...typography.body,
    fontWeight: "500",
  },
});
