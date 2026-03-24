import { ScrollView, Text, View, StyleSheet, Pressable, Linking } from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "@/hooks/useAppTheme";
import { colors, spacing, radii, shadows, typography } from "@/theme";

const PRIVACY_POLICY_URL = "https://casperevents.org/privacy";

export default function PrivacyScreen() {
  const theme = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Privacy Policy" }} />
      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
      >
        <Pressable
          style={[styles.ctaBtn, { backgroundColor: colors.primary[600] }]}
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          accessibilityLabel="View full privacy policy in browser"
          accessibilityRole="link"
        >
          <Ionicons name="shield-checkmark" size={20} color="#fff" />
          <Text style={styles.ctaBtnText}>View Full Privacy Policy</Text>
        </Pressable>

        <View style={[styles.card, shadows.sm, { backgroundColor: theme.surface }]}>
          <Text style={[styles.muted, { color: theme.textTertiary }]}>Last updated: March 2026</Text>

          <Text style={[styles.heading, { color: theme.text }]}>Summary</Text>
          <Text style={[styles.para, { color: theme.textSecondary }]}>
            Wyoming Events Calendar ("we", "us", "our") operates this mobile app
            and the casperevents.org platform. This Privacy Policy explains how we
            collect, use, and protect your information.
          </Text>

          <Text style={[styles.heading, { color: theme.text }]}>Information We Collect</Text>
          <Text style={[styles.bullet, { color: theme.textSecondary }]}>
            • Push notifications: your device token and which organizations you
            subscribe to (stored to send event reminders)
          </Text>
          <Text style={[styles.bullet, { color: theme.textSecondary }]}>
            • City filter: your selected city (stored on your device only)
          </Text>

          <Text style={[styles.heading, { color: theme.text }]}>How We Use It</Text>
          <Text style={[styles.para, { color: theme.textSecondary }]}>
            We use your information to display events, send push reminders 1.5
            hours before events you've subscribed to, and improve the platform.
          </Text>

          <Text style={[styles.heading, { color: theme.text }]}>Data Sharing</Text>
          <Text style={[styles.para, { color: theme.textSecondary }]}>
            We do not sell your data. Push notifications are delivered via Expo's
            push service.
          </Text>

          <Text style={[styles.heading, { color: theme.text }]}>Contact</Text>
          <Pressable
            onPress={() => Linking.openURL("mailto:privacy@casperevents.org")}
            accessibilityLabel="Email privacy@casperevents.org"
            accessibilityRole="link"
          >
            <Text style={[styles.link, { color: theme.tint }]}>privacy@casperevents.org</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing["4xl"] },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: 16,
    borderRadius: radii.md,
  },
  ctaBtnText: {
    color: "#fff",
    ...typography.body,
    fontWeight: "700",
  },
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
  bullet: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  link: {
    ...typography.body,
    fontWeight: "500",
  },
});
