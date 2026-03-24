import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { api } from "@/lib/api";
import { Colors } from "@/lib/constants";

export function DigestSignup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      await api.post("/digest/subscribe", { email: email.trim() });
      setMessage({
        type: "success",
        text: "You're subscribed! Check your inbox.",
      });
      setEmail("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to subscribe",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>✉️</Text>
        <View style={styles.headerText}>
          <Text style={styles.title} accessibilityRole="header">
            Weekly Events Digest
          </Text>
          <Text style={styles.desc}>
            Get upcoming events in your inbox every Monday.
          </Text>
        </View>
      </View>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          placeholderTextColor={Colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
          accessibilityLabel="Email for weekly digest"
        />
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Subscribe to digest"
          accessibilityState={{ disabled: loading }}
        >
          <Text style={styles.buttonText}>
            {loading ? "..." : "Subscribe"}
          </Text>
        </Pressable>
      </View>
      {message && (
        <Text
          style={[
            styles.message,
            message.type === "success" ? styles.messageSuccess : styles.messageError,
          ]}
          accessibilityRole="alert"
        >
          {message.text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary + "08",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary + "20",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  desc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  form: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.textInverse,
    fontWeight: "700",
    fontSize: 14,
  },
  message: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "500",
  },
  messageSuccess: {
    color: Colors.success,
  },
  messageError: {
    color: Colors.error,
  },
});
