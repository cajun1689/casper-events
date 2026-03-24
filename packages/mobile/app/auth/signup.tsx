import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { signUp, confirmSignUp, signIn } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { Colors } from "@/lib/constants";

export default function SignupScreen() {
  const router = useRouter();
  const { setToken } = useStore();
  const [step, setStep] = useState<"register" | "verify">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, name.trim());
      setStep("verify");
    } catch (err) {
      Alert.alert(
        "Registration Failed",
        err instanceof Error ? err.message : "Could not create account",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      Alert.alert("Error", "Please enter the verification code.");
      return;
    }

    setLoading(true);
    try {
      await confirmSignUp(email.trim().toLowerCase(), code.trim());
      const token = await signIn(email.trim().toLowerCase(), password);
      setToken(token);
      router.back();
    } catch (err) {
      Alert.alert(
        "Verification Failed",
        err instanceof Error ? err.message : "Invalid code",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.form}>
        <Text style={styles.heading} accessibilityRole="header">
          {step === "register" ? "Create Account" : "Verify Email"}
        </Text>
        <Text style={styles.subheading}>
          {step === "register"
            ? "Join the Wyoming Events Calendar community"
            : `Enter the 6-digit code sent to ${email}`}
        </Text>

        {step === "register" ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={Colors.textSecondary}
              value={name}
              onChangeText={setName}
              textContentType="name"
              autoComplete="name"
              accessibilityLabel="Full name"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              accessibilityLabel="Email address"
            />
            <TextInput
              style={styles.input}
              placeholder="Password (8+ characters)"
              placeholderTextColor={Colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              accessibilityLabel="Password"
            />
            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Create account"
              accessibilityState={{ disabled: loading }}
            >
              <Text style={styles.buttonText}>
                {loading ? "Creating..." : "Create Account"}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Verification Code"
              placeholderTextColor={Colors.textSecondary}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              accessibilityLabel="Verification code"
            />
            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Verify code"
              accessibilityState={{ disabled: loading }}
            >
              <Text style={styles.buttonText}>
                {loading ? "Verifying..." : "Verify"}
              </Text>
            </Pressable>
          </>
        )}

        <Pressable
          onPress={() => {
            router.back();
            router.push("/auth/login");
          }}
          accessibilityRole="link"
          accessibilityLabel="Sign in to existing account"
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkBold}>Sign In</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  form: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 2,
  },
  subheading: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    height: 48,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.textInverse,
    fontWeight: "700",
    fontSize: 16,
  },
  linkText: {
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  linkBold: {
    color: Colors.primary,
    fontWeight: "600",
  },
});
