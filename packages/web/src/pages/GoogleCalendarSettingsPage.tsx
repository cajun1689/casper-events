import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Unlink,
  RefreshCw,
  ChevronDown,
  ImageIcon,
  Clock,
  Zap,
} from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";

interface GoogleCalStatus {
  connected: boolean;
  calendarId: string | null;
}

interface GoogleCalendar {
  id: string;
  name: string;
  primary: boolean;
  color: string | null;
}

interface CalendarsResponse {
  calendars: GoogleCalendar[];
  selectedCalendarId: string | null;
}

export default function GoogleCalendarSettingsPage() {
  const { token } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<GoogleCalStatus | null>(null);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalId, setSelectedCalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [savingCal, setSavingCal] = useState(false);
  const [justConnected] = useState(
    searchParams.get("google") === "connected"
  );
  const [error, setError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [savingApproval, setSavingApproval] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get<GoogleCalStatus>("/google-calendar/status");
      setStatus(res);

      if (res.connected) {
        const calRes = await api.get<CalendarsResponse>("/google-calendar/calendars");
        setCalendars(calRes.calendars);
        setSelectedCalId(calRes.selectedCalendarId);
        try {
          const settingsRes = await api.get<{ requireGoogleEventApproval: boolean }>("/google-calendar/settings");
          setRequireApproval(settingsRes.requireGoogleEventApproval);
        } catch {
          setRequireApproval(false);
        }
      }
    } catch {
      setStatus({ connected: false, calendarId: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchStatus();
  }, [token, navigate, fetchStatus]);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const returnOrigin = encodeURIComponent(window.location.origin);
      const res = await api.get<{ url: string }>(`/auth/google/connect?return_origin=${returnOrigin}`);
      if (res.url) {
        window.location.href = res.url;
      } else {
        setError("No redirect URL returned. Please try again.");
        setConnecting(false);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect. Make sure you're logged in."
      );
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Disconnect Google Calendar? Imported events will remain but no new events will sync."
      )
    )
      return;
    setDisconnecting(true);
    try {
      await api.delete("/google-calendar/disconnect");
      setStatus({ connected: false, calendarId: null });
      setCalendars([]);
      setSelectedCalId(null);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleCalendarChange = async (calId: string) => {
    setSavingCal(true);
    try {
      await api.put("/google-calendar/calendar", { calendarId: calId });
      setSelectedCalId(calId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update calendar"
      );
    } finally {
      setSavingCal(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncSuccess(false);
    setError(null);
    try {
      await api.post("/google-calendar/sync");
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
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
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 text-white shadow-lg shadow-blue-500/25">
          <CalendarDays className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Google Calendar
          </h1>
          <p className="text-sm text-gray-500">
            Import events automatically from your Google Calendar.
          </p>
        </div>
      </div>

      {justConnected && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50 px-4 py-3 animate-fade-in">
          <Check className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-700">
            Google Calendar connected successfully!
          </p>
        </div>
      )}

      {syncSuccess && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50 px-4 py-3 animate-fade-in">
          <Check className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-700">
            Calendar synced successfully! New events have been imported.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200/60 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Connection Status */}
      <div
        className={clsx(
          "rounded-2xl border p-6 shadow-sm backdrop-blur-sm",
          status?.connected
            ? "border-emerald-200/60 bg-emerald-50/30"
            : "border-gray-200/60 bg-white/80"
        )}
      >
        <h2 className="mb-4 text-base font-bold text-gray-900">
          Connection Status
        </h2>

        {status?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Connected</p>
                <p className="text-xs text-gray-500">
                  Calendar: {selectedCalId || "primary"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:-translate-y-px disabled:opacity-50"
              >
                <RefreshCw
                  className={clsx("h-4 w-4", syncing && "animate-spin")}
                />
                {syncing ? "Syncing..." : "Sync Now"}
              </button>
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
              Connect your Google Calendar to automatically import events into
              Casper Events. Events will sync periodically, and any images
              attached to your Google Calendar events will be pulled in as event
              images.
            </p>

            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-green-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-px hover:shadow-xl disabled:opacity-50"
            >
              {connecting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarDays className="h-4 w-4" />
              )}
              {connecting ? "Connecting..." : "Connect Google Calendar"}
            </button>
          </div>
        )}
      </div>

      {/* Auto-publish toggle - prominent section */}
      {status?.connected && (
        <div className="mt-6 rounded-2xl border-2 border-amber-200/80 bg-amber-50/50 p-6 shadow-sm backdrop-blur-sm">
          <h2 className="mb-2 text-base font-bold text-gray-900">
            Auto-publish imported events
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            By default, imported Google Calendar events appear on the public calendar immediately. Turn this off to review and approve each event before it goes live.
          </p>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/80 p-4 border border-amber-200/60">
            <input
              type="checkbox"
              checked={requireApproval}
              onChange={async (e) => {
                const next = e.target.checked;
                setSavingApproval(true);
                try {
                  await api.put("/google-calendar/settings", { requireGoogleEventApproval: next });
                  setRequireApproval(next);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to update");
                } finally {
                  setSavingApproval(false);
                }
              }}
              disabled={savingApproval}
              className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="text-sm font-semibold text-gray-800">
                {requireApproval ? "Manual approval ON" : "Manual approval OFF"}
              </span>
              <p className="text-xs text-gray-600 mt-1">
                {requireApproval
                  ? "Imported events are saved as drafts. Approve them from your dashboard before they appear publicly."
                  : "Imported events are published automatically."}
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Calendar Selection */}
      {status?.connected && calendars.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
          <h2 className="mb-4 text-base font-bold text-gray-900">
            Select Calendar
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Choose which Google Calendar to sync events from.
          </p>

          <div className="relative">
            <select
              value={selectedCalId || ""}
              onChange={(e) => handleCalendarChange(e.target.value)}
              disabled={savingCal}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm font-semibold text-gray-700 shadow-sm transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:opacity-50"
            >
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.name}
                  {cal.primary ? " (Primary)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
          {savingCal && (
            <p className="mt-2 text-xs text-blue-600 font-semibold">
              Updating...
            </p>
          )}
        </div>
      )}

      {/* How It Works */}
      <div className="mt-6 rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
        <h2 className="mb-4 text-base font-bold text-gray-900">
          How It Works
        </h2>
        <div className="space-y-4">
          {[
            {
              icon: Zap,
              title: "Automatic Sync",
              desc: "Events are imported automatically on a regular schedule. You can also trigger a manual sync at any time.",
              gradient: "from-amber-500 to-amber-600",
            },
            {
              icon: ImageIcon,
              title: "Image Attachments",
              desc: "Attach an image to your Google Calendar event and it will be used as the event image in Casper Events.",
              gradient: "from-violet-500 to-violet-600",
            },
            {
              icon: Clock,
              title: "Keeps Events Updated",
              desc: "When you update an event in Google Calendar (title, time, description), those changes will sync over automatically.",
              gradient: "from-emerald-500 to-emerald-600",
            },
            {
              icon: CalendarDays,
              title: "90-Day Window",
              desc: "Events are synced from today up to 90 days in the future. Past events are not imported.",
              gradient: "from-blue-500 to-blue-600",
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} shadow`}
              >
                <item.icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Note */}
      <div className="mt-6 rounded-2xl border border-amber-200/60 bg-amber-50/30 p-6 shadow-sm">
        <h2 className="mb-2 text-base font-bold text-gray-900">
          Permissions & Privacy
        </h2>
        <p className="text-sm text-gray-600">
          Casper Events only requests <strong>read-only</strong> access to your
          Google Calendar and Google Drive (for image attachments). We never
          modify, delete, or create events in your Google Calendar. You can
          revoke access at any time from this page or from your{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 underline hover:no-underline"
          >
            Google Account permissions
          </a>
          .
        </p>
      </div>
    </div>
  );
}
