import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, CalendarDays, Settings, BarChart3, Clock, CheckCircle2, AlertCircle, Facebook, Share2, Calendar } from "lucide-react";
import { useStore } from "@/lib/store";
import { eventsApi, api } from "@/lib/api";
import type { EventWithDetails } from "@cyh/shared";

export default function DashboardPage() {
  const { token, user, organization } = useStore();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [fbConnected, setFbConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    if (!organization) { setLoading(false); return; }
    Promise.all([
      eventsApi.list({ orgId: organization.id }),
      api.get<{ connected: boolean }>("/facebook/pages").catch(() => ({ connected: false })),
      api.get<{ connected: boolean }>("/google-calendar/status").catch(() => ({ connected: false })),
    ]).then(([eventsRes, fbRes, googleRes]) => {
      setEvents(eventsRes.data);
      setFbConnected(fbRes.connected);
      setGoogleConnected(googleRes.connected);
      setLoading(false);
    });
  }, [token, organization, navigate]);

  const shareToFacebook = async (eventId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (sharingId) return;
    setSharingId(eventId);
    try {
      await eventsApi.shareToFacebook(eventId);
      alert("Shared to Facebook!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to share");
    } finally {
      setSharingId(null);
    }
  };

  const stats = {
    total: events.length,
    published: events.filter((e) => e.status === "published").length,
    approved: events.filter((e) => e.status === "approved").length,
    pending: events.filter((e) => e.status === "draft").length,
  };

  if (!organization) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25">
          <CalendarDays className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-2">No Organization Yet</h1>
        <p className="text-gray-500 mb-6">Register your organization to start posting events.</p>
        <Link to="/organizations" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px">
          Browse Organizations
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{organization.name}</h1>
          <p className="text-sm text-gray-500">Manage your events and organization settings</p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/google-calendar" className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 hover:shadow">
            <Calendar className="h-4 w-4" /> {googleConnected ? "Google Cal" : "Connect Google"}
          </Link>
          <Link to="/dashboard/facebook" className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200/80 bg-blue-50/50 px-4 py-2.5 text-sm font-semibold text-[#1877F2] shadow-sm transition-all hover:bg-blue-50 hover:shadow">
            <Facebook className="h-4 w-4" /> {fbConnected ? "Facebook" : "Connect Facebook"}
          </Link>
          <Link to="/dashboard/embed" className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/60 px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow">
            <Settings className="h-4 w-4" /> Embed Settings
          </Link>
          {organization?.status === "active" ? (
            <Link to="/dashboard/events/new" className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px">
              <Plus className="h-4 w-4" /> New Event
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-gray-200 px-4 py-2.5 text-sm font-bold text-gray-400 cursor-not-allowed" title="Organization approval required">
              <Plus className="h-4 w-4" /> New Event
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Events", value: stats.total, icon: BarChart3, gradient: "from-blue-500 to-blue-600" },
          { label: "Published", value: stats.published, icon: CalendarDays, gradient: "from-emerald-500 to-emerald-600" },
          { label: "Approved", value: stats.approved, icon: CheckCircle2, gradient: "from-violet-500 to-violet-600" },
          { label: "Drafts", value: stats.pending, icon: Clock, gradient: "from-amber-500 to-amber-600" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-200/60 bg-white/70 p-5 shadow-sm backdrop-blur-sm">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
            <p className="text-xs font-semibold text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {organization.status === "pending" && (
        <div className="mb-8 rounded-2xl border border-orange-200/60 bg-orange-50/50 p-5 backdrop-blur-sm animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-semibold text-orange-700">
            <Clock className="h-4 w-4" />
            Organization Pending Approval
          </div>
          <p className="mt-1 text-sm text-orange-600">
            Your organization is currently under review. Once approved by an admin, you'll be able to create and publish events. This usually takes 1–2 business days.
          </p>
        </div>
      )}

      {organization.status === "suspended" && (
        <div className="mb-8 rounded-2xl border border-red-200/60 bg-red-50/50 p-5 backdrop-blur-sm animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <AlertCircle className="h-4 w-4" />
            Organization Suspended
          </div>
          <p className="mt-1 text-sm text-red-600">
            Your organization has been suspended. Please contact an administrator for assistance.
          </p>
        </div>
      )}

      {user?.isAdmin && (
        <div className="mb-8 rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <AlertCircle className="h-4 w-4" />
            Admin Access
          </div>
          <p className="mt-1 text-sm text-amber-600">
            <Link to="/admin" className="font-bold underline hover:no-underline">Open Admin Dashboard</Link> to review events and manage organizations.
          </p>
        </div>
      )}

      {/* Events list */}
      <div className="rounded-2xl border border-gray-200/60 bg-white/70 shadow-sm backdrop-blur-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Your Events</h2>
        </div>
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 w-full" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm font-semibold text-gray-400">No events yet</p>
            <p className="text-xs text-gray-400 mt-1">Create your first event to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map((event) => (
              <Link key={event.id} to={`/events/${event.id}`} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-primary-50/30">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-700">
                  <span className="text-[9px] font-bold uppercase leading-none">{new Date(event.startAt).toLocaleDateString("en", { month: "short" })}</span>
                  <span className="text-base font-extrabold leading-tight">{new Date(event.startAt).getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-400">{event.venueName ?? "No venue"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {fbConnected && (
                    <button
                      onClick={(e) => shareToFacebook(event.id, e)}
                      disabled={sharingId === event.id}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-blue-50 hover:text-[#1877F2] disabled:opacity-50"
                      title="Share to Facebook"
                    >
                      {sharingId === event.id ? (
                        <Share2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Facebook className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    event.status === "approved" ? "bg-emerald-50 text-emerald-600" :
                    event.status === "published" ? "bg-blue-50 text-blue-600" :
                    event.status === "rejected" ? "bg-red-50 text-red-600" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {event.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
