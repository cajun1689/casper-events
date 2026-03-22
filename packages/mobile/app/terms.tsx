import { View, StyleSheet, Text, ScrollView, Linking } from "react-native";
import { Link, Stack } from "expo-router";
import { Pressable } from "react-native";

export default function TermsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Terms of Service" }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.muted}>Last updated: March 2026</Text>

        <Text style={styles.heading}>Acceptance</Text>
        <Text style={styles.para}>
          By using Wyoming Events Calendar, you agree to these Terms of Service.
        </Text>

        <Text style={styles.heading}>The Service</Text>
        <Text style={styles.para}>
          Wyoming Events Calendar is a free, community-driven event calendar
          for events across Wyoming. Organizations post events; you can browse,
          filter by city, and subscribe to push notifications.
        </Text>

        <Text style={styles.heading}>Event Content</Text>
        <Text style={styles.para}>
          Events must be real, community-relevant activities. Submitted events
          may be reviewed before appearing on the calendar. We reserve the right
          to remove events that violate these terms.
        </Text>

        <Text style={styles.heading}>Limitation of Liability</Text>
        <Text style={styles.para}>
          Wyoming Events Calendar is provided "as is" without warranties. We
          are not liable for event accuracy, cancellations, or damages from use.
        </Text>

        <Text style={styles.heading}>Contact</Text>
        <Pressable
          onPress={() => Linking.openURL("mailto:info@casperevents.org")}
          accessibilityLabel="Email info@casperevents.org"
          accessibilityRole="link"
        >
          <Text style={styles.link}>info@casperevents.org</Text>
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

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
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
