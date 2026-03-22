import { View, StyleSheet, Text, ScrollView, Linking } from "react-native";
import { Link, Stack } from "expo-router";
import { Pressable } from "react-native";

export default function PrivacyScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Privacy Policy" }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Pressable
          style={styles.fullPolicyBtn}
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          accessibilityLabel="View full privacy policy in browser"
          accessibilityRole="button"
        >
          <Text style={styles.fullPolicyBtnText}>
            View Full Privacy Policy (App Store & Play Store)
          </Text>
        </Pressable>

        <Text style={styles.muted}>Last updated: March 2026</Text>
        <Text style={styles.para}>
          The full policy at casperevents.org/privacy complies with Apple App Store and Google Play Store requirements.
        </Text>

        <Text style={styles.heading}>Summary</Text>
        <Text style={styles.para}>
          Wyoming Events Calendar ("we", "us", "our") operates this mobile app
          and the casperevents.org platform. This Privacy Policy explains how we
          collect, use, and protect your information.
        </Text>

        <Text style={styles.heading}>Information We Collect</Text>
        <Text style={styles.para}>
          • Account info: email, name, organization (when you register)
        </Text>
        <Text style={styles.para}>
          • Push notifications: your device token and which organizations you
          subscribe to (stored to send event reminders)
        </Text>
        <Text style={styles.para}>
          • City filter: your selected city (stored on your device only)
        </Text>

        <Text style={styles.heading}>How We Use It</Text>
        <Text style={styles.para}>
          We use your information to display events, send push reminders 1.5
          hours before events you've subscribed to, and improve the platform.
        </Text>

        <Text style={styles.heading}>Data Sharing</Text>
        <Text style={styles.para}>
          We do not sell your data. Push notifications are delivered via Expo's
          push service.
        </Text>

        <Text style={styles.heading}>Contact</Text>
        <Pressable
          onPress={() => Linking.openURL("mailto:privacy@casperevents.org")}
          accessibilityLabel="Email privacy@casperevents.org"
          accessibilityRole="link"
        >
          <Text style={styles.link}>privacy@casperevents.org</Text>
        </Pressable>

        <Link href="/" asChild>
          <Pressable style={styles.backBtn}>
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </>
  );
}

const PRIVACY_POLICY_URL = "https://casperevents.org/privacy";

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  fullPolicyBtn: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  fullPolicyBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  muted: { fontSize: 12, color: "#999", marginBottom: 16 },
  heading: { fontSize: 16, fontWeight: "600", marginTop: 16, marginBottom: 6 },
  para: { fontSize: 14, color: "#444", marginBottom: 6, lineHeight: 20 },
  link: { fontSize: 14, color: "#2563eb" },
  backBtn: {
    marginTop: 24,
    padding: 14,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  backBtnText: { fontWeight: "600" },
});
