import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors } from "@/lib/constants";

export default function UnsubscribedScreen() {
  const router = useRouter();
  const { digest } = useLocalSearchParams<{ digest?: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✅</Text>
      <Text style={styles.heading} accessibilityRole="header">
        You've been unsubscribed
      </Text>
      <Text style={styles.body}>
        {digest === "1"
          ? "You will no longer receive the weekly events digest email."
          : "You have been successfully unsubscribed."}
      </Text>
      <Text style={styles.note}>
        If this was a mistake, you can re-subscribe from the Settings tab.
      </Text>
      <Pressable
        style={styles.button}
        onPress={() => router.replace("/")}
        accessibilityRole="button"
        accessibilityLabel="Return to events"
      >
        <Text style={styles.buttonText}>Back to Events</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  note: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.8,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: Colors.textInverse,
    fontWeight: "700",
    fontSize: 16,
  },
});
