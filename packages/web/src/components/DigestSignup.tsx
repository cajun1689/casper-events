import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { digestApi } from "@/lib/api";

export function DigestSignup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      await digestApi.subscribe({ email: email.trim() });
      setMessage({ type: "success", text: "You're subscribed! Check your inbox for a confirmation." });
      setEmail("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to subscribe" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-primary-200/60 bg-gradient-to-br from-primary-50/40 to-white p-6 shadow-sm backdrop-blur-sm sm:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">Get weekly events in your inbox</h3>
          <p className="text-sm text-gray-600">We'll send you a digest of upcoming events every Monday.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? "..." : "Subscribe"}
        </button>
      </form>
      {message && (
        <p className={`mt-3 text-sm font-medium ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
