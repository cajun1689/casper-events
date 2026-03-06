import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Facebook, Check, AlertTriangle, Unlink, ExternalLink, RefreshCw } from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";

interface FbStatus {
  connected: boolean;
  pageId: string | null;
  pageName?: string;
}

export default function FacebookSettingsPage() {
  const { token, organization } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<FbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [justConnected] = useState(searchParams.get("facebook") === "connected");
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get<FbStatus>("/facebook/pages");
      setStatus(res);
    } catch {
      setStatus({ connected: false, pageId: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchStatus();
  }, [token, navigate, fetchStatus]);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const res = await api.get<{ url: string }>("/auth/facebook/connect");
      if (res.url) {
        window.location.href = res.url;
      } else {
        setError("No redirect URL returned. Please try again.");
        setConnecting(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect. Make sure you're logged in.");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect your Facebook Page? You can reconnect anytime.")) return;
    setDisconnecting(true);
    try {
      await api.delete("/facebook/disconnect");
      setStatus({ connected: false, pageId: null });
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
      <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-lg shadow-blue-500/25">
          <Facebook className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Facebook Integration</h1>
          <p className="text-sm text-gray-500">Connect your Facebook Page to create events and share posts.</p>
        </div>
      </div>

      {justConnected && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200/60 px-4 py-3 animate-fade-in">
          <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-emerald-700">Facebook Page connected successfully!</p>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200/60 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Connection Status */}
      <div className={clsx(
        "rounded-2xl border p-6 shadow-sm backdrop-blur-sm",
        status?.connected
          ? "border-emerald-200/60 bg-emerald-50/30"
          : "border-gray-200/60 bg-white/80"
      )}>
        <h2 className="text-base font-bold text-gray-900 mb-4">Connection Status</h2>

        {status?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Connected</p>
                <p className="text-xs text-gray-500">Page ID: {status.pageId}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href={`https://facebook.com/${status.pageId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/60 px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition-all hover:bg-white hover:shadow"
              >
                <ExternalLink className="h-4 w-4" /> View Page
              </a>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200/80 bg-red-50/50 px-4 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 hover:shadow disabled:opacity-50"
              >
                <Unlink className="h-4 w-4" />
                {disconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Connect your organization's Facebook Page to automatically create Facebook Events
              and share event posts directly from Casper Events.
            </p>

            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1877F2] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-[#166FE5] hover:shadow-xl hover:-translate-y-px disabled:opacity-50"
            >
              {connecting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Facebook className="h-4 w-4" />
              )}
              {connecting ? "Connecting..." : "Connect Facebook Page"}
            </button>
          </div>
        )}
      </div>

      {/* What you can do */}
      <div className="mt-6 rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4">What You Can Do</h2>
        <div className="space-y-3">
          {[
            {
              title: "Create Facebook Events",
              desc: "When creating an event, toggle \"Create Facebook Event\" to automatically publish it to your Facebook Page.",
              available: status?.connected,
            },
            {
              title: "Share to Page Feed",
              desc: "Share any event as a post on your Facebook Page's timeline to boost visibility.",
              available: status?.connected,
            },
            {
              title: "Auto-sync Event Details",
              desc: "Title, description, date, venue, image, and ticket URL are all sent to Facebook.",
              available: status?.connected,
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-xl bg-gray-50/80 px-4 py-3">
              <div className={clsx(
                "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full",
                item.available ? "bg-emerald-100" : "bg-gray-200"
              )}>
                <Check className={clsx("h-3 w-3", item.available ? "text-emerald-600" : "text-gray-400")} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Note */}
      <div className="mt-6 rounded-2xl border border-amber-200/60 bg-amber-50/30 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-800">About Facebook API Permissions</h3>
            <p className="mt-1 text-xs text-amber-700 leading-relaxed">
              Creating Facebook Events requires the <code className="font-mono bg-amber-100 px-1 rounded">pages_manage_events</code> permission,
              which needs approval from Meta through App Review. Until approved, you can still share events
              as Page feed posts (which uses <code className="font-mono bg-amber-100 px-1 rounded">pages_manage_posts</code>).
            </p>
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              <ExternalLink className="h-3 w-3" /> Meta Developer Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
