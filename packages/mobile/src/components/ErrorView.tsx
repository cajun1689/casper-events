import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors } from "@/lib/constants";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorView({ message = "Something went wrong", onRetry }: Props) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Pressable
          style={styles.button}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: Colors.background,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.textInverse,
    fontWeight: "600",
    fontSize: 15,
  },
});
