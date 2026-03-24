import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import {
  signIn,
  completeNewPassword,
  forgotPassword,
  confirmForgotPassword,
} from "@/lib/auth";
import { useStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import { Colors } from "@/lib/constants";

type Step = "login" | "newPassword" | "forgotPassword" | "resetCode";

export default function LoginScreen() {
  const router = useRouter();
  const { setToken, setUser, setOrganization } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("login");
  const [error, setError] = useState<string | null>(null);

  const completeLogin = async (token: string) => {
    setToken(token);
    try {
      const me = await authApi.me();
      setUser(me.user);
      setOrganization(me.organization);
    } catch {
      // non-fatal
    }
    router.back();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await signIn(email.trim().toLowerCase(), password);
      await completeLogin(token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      if (msg === "NEW_PASSWORD_REQUIRED") {
        setStep("newPassword");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewPassword = async () => {
    if (newPw !== confirmPw) {
      setError("Passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await completeNewPassword(
        email.trim().toLowerCase(),
        password,
        newPw,
      );
      await completeLogin(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your email first");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setStep("resetCode");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset code",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPw !== confirmPw) {
      setError("Passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await confirmForgotPassword(
        email.trim().toLowerCase(),
        resetCode,
        newPw,
      );
      Alert.alert("Success", "Password reset! Sign in with your new password.");
      setStep("login");
      setPassword("");
      setNewPw("");
      setConfirmPw("");
      setResetCode("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset password",
      );
    } finally {
      setLoading(false);
    }
  };

  const heading =
    step === "login"
      ? "Welcome Back"
      : step === "newPassword"
        ? "Set New Password"
        : step === "forgotPassword"
          ? "Reset Password"
          : "Enter Reset Code";

  const subheading =
    step === "login"
      ? "Sign in to your Wyoming Events Calendar account"
      : step === "newPassword"
        ? "Your account requires a new password"
        : step === "forgotPassword"
          ? "Enter your email and we'll send a reset code"
          : `We sent a code to ${email}`;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={styles.heading} accessibilityRole="header">
            {heading}
          </Text>
          <Text style={styles.subheading}>{subheading}</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {step === "login" && (
            <>
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
                placeholder="Password"
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                autoComplete="password"
                accessibilityLabel="Password"
              />
              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                accessibilityState={{ disabled: loading }}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Signing in..." : "Sign In"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setError(null);
                  setStep("forgotPassword");
                }}
                accessibilityRole="button"
                accessibilityLabel="Forgot your password?"
              >
                <Text style={styles.forgotText}>Forgot your password?</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  router.back();
                  router.push("/auth/signup");
                }}
                accessibilityRole="link"
                accessibilityLabel="Create an account"
              >
                <Text style={styles.linkText}>
                  Don't have an account?{" "}
                  <Text style={styles.linkBold}>Sign Up</Text>
                </Text>
              </Pressable>
            </>
          )}

          {step === "forgotPassword" && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                accessibilityLabel="Email address"
              />
              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleForgotPassword}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Send reset code"
                accessibilityState={{ disabled: loading }}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Sending..." : "Send Reset Code"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setError(null);
                  setStep("login");
                }}
                accessibilityRole="button"
              >
                <Text style={styles.linkText}>← Back to sign in</Text>
              </Pressable>
            </>
          )}

          {step === "resetCode" && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={false}
                accessibilityLabel="Email address"
              />
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="000000"
                placeholderTextColor={Colors.textSecondary}
                value={resetCode}
                onChangeText={setResetCode}
                keyboardType="number-pad"
                maxLength={6}
                textContentType="oneTimeCode"
                accessibilityLabel="Reset code"
              />
              <TextInput
                style={styles.input}
                placeholder="New password (min 8 chars)"
                placeholderTextColor={Colors.textSecondary}
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry
                textContentType="newPassword"
                accessibilityLabel="New password"
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={Colors.textSecondary}
                value={confirmPw}
                onChangeText={setConfirmPw}
                secureTextEntry
                textContentType="newPassword"
                accessibilityLabel="Confirm new password"
              />
              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Reset password"
                accessibilityState={{ disabled: loading }}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Resetting..." : "Reset Password"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setError(null);
                  setStep("login");
                }}
                accessibilityRole="button"
              >
                <Text style={styles.linkText}>← Back to sign in</Text>
              </Pressable>
            </>
          )}

          {step === "newPassword" && (
            <>
              <Text style={styles.infoText}>
                Your account was created by an admin. Choose a new password.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="New password (min 8 chars)"
                placeholderTextColor={Colors.textSecondary}
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry
                textContentType="newPassword"
                accessibilityLabel="New password"
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={Colors.textSecondary}
                value={confirmPw}
                onChangeText={setConfirmPw}
                secureTextEntry
                textContentType="newPassword"
                accessibilityLabel="Confirm new password"
              />
              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleNewPassword}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Set new password"
                accessibilityState={{ disabled: loading }}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Setting..." : "Set Password"}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
  },
  form: {
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
  errorBox: {
    backgroundColor: Colors.error + "12",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.error + "30",
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 8,
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
  codeInput: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 8,
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
  forgotText: {
    textAlign: "center",
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
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
