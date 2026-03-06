import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { useStore } from "@/lib/store";
import { authApi } from "@/lib/api";

const cognito = new CognitoIdentityProviderClient({ region: "us-east-1" });
const CLIENT_ID = "6iiuflu8b3r81fr57oifkj1o6a";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useStore();
  const navigate = useNavigate();

  const [step, setStep] = useState<"login" | "newPassword" | "forgotPassword" | "resetCode">("login");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [challengeSession, setChallengeSession] = useState<string | null>(null);
  const [resetCode, setResetCode] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  async function completeLogin(idToken: string) {
    const payload = JSON.parse(atob(idToken.split(".")[1]));
    localStorage.setItem("cyh_token", idToken);

    let profile: { user: unknown; organization: unknown };
    try {
      profile = await authApi.me();
    } catch {
      const pendingOrg = sessionStorage.getItem("cyh_pending_org");
      const orgData = pendingOrg ? JSON.parse(pendingOrg) : {};
      await authApi.register(orgData);
      sessionStorage.removeItem("cyh_pending_org");
      profile = await authApi.me();
    }

    setAuth(
      idToken,
      {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        isAdmin: (profile.user as Record<string, unknown>)?.isAdmin as boolean,
      },
      profile.organization as { id: string; name: string; slug: string; status?: string } | null,
    );

    navigate("/dashboard");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await cognito.send(
        new InitiateAuthCommand({
          AuthFlow: "USER_PASSWORD_AUTH",
          ClientId: CLIENT_ID,
          AuthParameters: { USERNAME: email, PASSWORD: password },
        })
      );

      if (result.ChallengeName === "NEW_PASSWORD_REQUIRED") {
        setChallengeSession(result.Session || null);
        setStep("newPassword");
        setLoading(false);
        return;
      }

      await completeLogin(result.AuthenticationResult!.IdToken!);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await cognito.send(
        new RespondToAuthChallengeCommand({
          ClientId: CLIENT_ID,
          ChallengeName: "NEW_PASSWORD_REQUIRED",
          Session: challengeSession!,
          ChallengeResponses: {
            USERNAME: email,
            NEW_PASSWORD: newPassword,
          },
        })
      );

      await completeLogin(result.AuthenticationResult!.IdToken!);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set new password");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await cognito.send(
        new ForgotPasswordCommand({ ClientId: CLIENT_ID, Username: email })
      );
      setStep("resetCode");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await cognito.send(
        new ConfirmForgotPasswordCommand({
          ClientId: CLIENT_ID,
          Username: email,
          ConfirmationCode: resetCode,
          Password: newPassword,
        })
      );
      setResetSuccess(true);
      setStep("login");
      setPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setResetCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-10 text-sm transition-all focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-100";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25">
            <LogIn className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            {step === "login" && "Welcome back"}
            {step === "newPassword" && "Set your new password"}
            {step === "forgotPassword" && "Reset your password"}
            {step === "resetCode" && "Enter reset code"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {step === "login" && "Sign in to manage your events and organization"}
            {step === "newPassword" && "Your account was created by an admin. Please choose a new password to continue."}
            {step === "forgotPassword" && "Enter your email and we'll send you a code to reset your password"}
            {step === "resetCode" && `We sent a reset code to ${email}`}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-8 shadow-xl shadow-gray-200/40 backdrop-blur-sm">
          {step === "login" ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {resetSuccess && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200/60 px-4 py-3 text-sm font-semibold text-emerald-700">
                  Password reset successfully! Sign in with your new password.
                </div>
              )}
              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" required />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="Enter your password" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep("forgotPassword"); setError(null); setResetSuccess(false); }}
                className="w-full text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
              >
                Forgot your password?
              </button>
            </form>
          ) : step === "forgotPassword" ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" required />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? "Sending..." : "Send Reset Code"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("login"); setError(null); }}
                className="inline-flex w-full items-center justify-center gap-1 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </button>
            </form>
          ) : step === "resetCode" ? (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
              )}

              <div className="rounded-xl bg-blue-50/80 px-4 py-3 text-sm text-blue-700">
                Check your inbox (and spam folder) for a 6-digit code.
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Reset Code</label>
                <input type="text" value={resetCode} onChange={(e) => setResetCode(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-4 text-center text-lg font-bold tracking-widest transition-all focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-100" placeholder="000000" required maxLength={6} autoComplete="one-time-code" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} placeholder="Min 8 characters" required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className={inputCls} placeholder="Confirm password" required minLength={8} />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("login"); setError(null); }}
                className="inline-flex w-full items-center justify-center gap-1 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleNewPassword} className="space-y-5">
              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
              )}

              <div className="rounded-xl bg-blue-50/80 px-4 py-3 text-sm text-blue-700">
                Choose a password with at least 8 characters, including uppercase, lowercase, and a number.
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} placeholder="Choose a new password" required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className={inputCls} placeholder="Confirm your new password" required minLength={8} />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Setting password...
                  </span>
                ) : (
                  "Set Password & Sign In"
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
