import { View, StyleSheet, Text, ScrollView, Linking } from "react-native";
import { Link, Stack } from "expo-router";
import { Pressable } from "react-native";

export default function AboutScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "About" }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Wyoming Events Calendar</Text>
        <Text style={styles.subtitle}>
          A free, open-source community event calendar for the whole state of
          Wyoming.
        </Text>

        <Text style={styles.heading}>Our Mission</Text>
        <Text style={styles.para}>
          Wyoming Events Calendar exists to make it easy for community members
          across Wyoming to discover what's happening locally — from youth
          programs and outdoor activities to veteran services, pride events, and
          everything in between.
        </Text>

        <Text style={styles.heading}>Built by Casper Youth Hub</Text>
        <Text style={styles.para}>
          Wyoming Events Calendar is built and maintained by Casper Youth Hub, a
          501(c)(3) nonprofit organization based in Casper, Wyoming. Our broader
          mission centers on youth mental health, focusing on ages 14–20.
        </Text>

        <Text style={styles.heading}>Features</Text>
        <Text style={styles.para}>• Browse events by city across Wyoming</Text>
        <Text style={styles.para}>• Push notifications for your favorite organizations</Text>
        <Text style={styles.para}>• Submit events for review</Text>
        <Text style={styles.para}>• No ads, no tracking, completely free</Text>

        <Text style={styles.heading}>Contact</Text>
        <Pressable
          onPress={() => Linking.openURL("mailto:hello@casperevents.org")}
          accessibilityLabel="Email hello@casperevents.org"
          accessibilityRole="link"
        >
          <Text style={styles.link}>hello@casperevents.org</Text>
        </Pressable>

        <Link href="/" asChild>
          <Pressable style={styles.backBtn}>
            <Text style={styles.backBtnText}>Back to Events</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#666", marginBottom: 24 },
  heading: { fontSize: 18, fontWeight: "600", marginBottom: 8, marginTop: 16 },
  para: { fontSize: 15, color: "#444", marginBottom: 8, lineHeight: 22 },
  link: { fontSize: 15, color: "#2563eb", marginBottom: 8 },
  backBtn: {
    marginTop: 24,
    padding: 14,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  backBtnText: { fontWeight: "600" },
});
