import { View, StyleSheet, Text, ScrollView } from "react-native";
import { Link, Stack } from "expo-router";
import { Pressable } from "react-native";

export default function UpdatesScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Updates" }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>What's New</Text>
        <Text style={styles.para}>
          Wyoming Events Calendar brings events from across the state to your
          device. Filter by city, get push reminders, and submit events for your
          community.
        </Text>

        <Text style={styles.heading}>Recent Features</Text>
        <Text style={styles.para}>• City filter: see events in your city</Text>
        <Text style={styles.para}>• Push notifications 1.5 hours before events</Text>
        <Text style={styles.para}>• Submit events for review</Text>
        <Text style={styles.para}>• Browse organizations and their events</Text>

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
  heading: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  para: { fontSize: 14, color: "#444", marginBottom: 6, lineHeight: 20 },
  backBtn: {
    marginTop: 24,
    padding: 14,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  backBtnText: { fontWeight: "600" },
});
