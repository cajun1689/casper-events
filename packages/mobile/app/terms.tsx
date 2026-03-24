import { ScrollView, Text, View, StyleSheet, Pressable, Linking } from "react-native";
import { Stack } from "expo-router";

import { useAppTheme } from "@/src/hooks/useAppTheme";
import { spacing, radii, shadows, typography } from "@/src/theme";

export default function TermsScreen() {
  const theme = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Terms of Service" }} />
      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.card, shadows.sm, { backgroundColor: theme.surface }]}>
          <Text style={[styles.muted, { color: theme.textTertiary }]}>Last updated: March 2026</Text>

          <Text style={[styles.heading, { color: theme.text }]}>Acceptance</Text>
          <Text style={[styles.para, { color: theme.textSecondary }]}>
            By using Wyoming Events Calendar, you agree to these Terms of Service.
          </Text>

          <Text style={[styles.heading, { color: theme.text }]}>The Service</Text>
          <Text style={[styles.para, { color: theme.textSecondary }]}>
            Wyoming Events Calendar is a free, community-driven event calendar
            for events across Wyoming. Organizations post events; you can browse,
            filter by city, and subscribe to push notifications.
          </Text>

          <Text style={[styles.heading, { color: theme.text }]}>Event Content</Text>
          <Text style={[styles.para, { color: theme.textSecondary }]}>
            Events must be real, community-relevant activities. Submitted events
            may be reviewed before appearing on the calendar. We reserve the right
            to remove events that violate these terms.
          </Text>

          <Text style={[styles.heading, { color: theme.text }]}>Limitation of Liability</Text>
          <Text style={[styles.para, { color: theme.textSecondary }]}>
            Wyoming Events Calendar is provided "as is" without warranties. We
            are not liable for event accuracy, cancellations, or damages from use.
          </Text>

          <Text style={[styles.heading, { color: theme.text }]}>Contact</Text>
          <Pressable
            onPress={() => Linking.openURL("mailto:info@casperevents.org")}
            accessibilityLabel="Email info@casperevents.org"
            accessibilityRole="link"
          >
            <Text style={[styles.link, { color: theme.tint }]}>info@casperevents.org</Text>
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
  muted: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  heading: {
    ...typography.headline,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  para: {
    ...typography.body,
    lineHeight: 22,
  },
  link: {
    ...typography.body,
    fontWeight: "500",
  },
});
