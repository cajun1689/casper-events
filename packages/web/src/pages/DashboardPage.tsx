import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, CalendarDays, Settings, BarChart3, Clock, CheckCircle2, AlertCircle, Facebook, Share2, Calendar, Pencil, Trash2, X, ExternalLink, ChevronDown, ChevronRight, History } from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { eventsApi, api } from "@/lib/api";
import type { EventWithDetails } from "@cyh/shared";

interface FacebookShareModalProps {
  event: EventWithDetails;
  onClose: () => void;
  onShared: () => void;
}

function FacebookShareModal({ event, onClose, onShared }: FacebookShareModalProps) {
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [eventUrl, setEventUrl] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    eventsApi.getFacebookPreview(event.id).then((res) => {
      setMessage(res.message);
      setLink(res.link);
      setEventUrl(res.eventUrl);
      setImageUrl(res.imageUrl ?? event.imageUrl ?? null);
      setLoading(false);
    }).catch(() => {
      setMessage(event.title);
      setLink(`https://casperevents.org/events/${event.id}`);
      setEventUrl(`https://casperevents.org/events/${event.id}`);
      setImageUrl(event.imageUrl ?? null);
      setLoading(false);
    });
  }, [event.id, event.title, event.imageUrl]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handlePost = async () => {
    setPosting(true);
    setError(null);
    try {
      await eventsApi.shareToFacebook(event.id, { message, link });
      onShared();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post to Facebook");
    } finally {
      setPosting(false);
    }
  };

  const resetLink = () => setLink(eventUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1877F2] shadow">
              <Facebook className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Share to Facebook</h2>
              <p className="text-xs text-gray-400">Customize your post before publishing</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-[#1877F2]" />
            </div>
          ) : (
            <>
              {imageUrl && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Event image (will appear in post)</label>
                  <div className="aspect-video max-h-40 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    <img src={imageUrl} alt={event.title} className="h-full w-full object-cover" />
                  </div>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Post message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={10}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm leading-relaxed transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 resize-none"
                />
                <p className="mt-1 text-xs text-gray-400">{message.length} characters</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Link attached to post</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    onClick={resetLink}
                    title="Reset to event page link"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 transition-all hover:bg-gray-50"
                  >
                    Reset
                  </button>
                </div>
                <a href={link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-blue-500 hover:underline">
                  <ExternalLink className="h-3 w-3" /> Preview link
                </a>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={posting || loading || !message.trim()}
            className={clsx(
              "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed",
              "bg-[#1877F2] shadow-blue-500/25",
            )}
          >
            <Facebook className="h-4 w-4" />
            {posting ? "Posting..." : "Post to Facebook"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { token, user, organization } = useStore();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [fbConnected, setFbConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [fbShareEvent, setFbShareEvent] = useState<EventWithDetails | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);

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

  const openFbShare = (event: EventWithDetails, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFbShareEvent(event);
  };

  const handleDelete = async (eventId: string) => {
    setDeleting(true);
    try {
      await eventsApi.delete(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const stats = {
    total: events.length,
    published: events.filter((e) => e.status === "published").length,
    approved: events.filter((e) => e.status === "approved").length,
    pending: events.filter((e) => e.status === "draft").length,
  };

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const upcoming: EventWithDetails[] = [];
    const past: EventWithDetails[] = [];
    for (const e of events) {
      const isPast = e.startAt.slice(0, 10) < todayStr;
      if (isPast) past.push(e);
      else upcoming.push(e);
    }
    past.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events]);

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
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem("cyh_token");
                const res = await fetch(`${import.meta.env.VITE_API_URL || "/api"}/admin/geocode-backfill`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                alert(`Geocoded ${data.updated} of ${data.total} events`);
              } catch { alert("Geocode failed"); }
            }}
            className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-amber-700"
          >
            Geocode Events (Map)
          </button>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-5 animate-fade-in">
          <p className="text-sm font-semibold text-red-700">Are you sure you want to delete this event?</p>
          <p className="mt-1 text-xs text-red-600">This action cannot be undone.</p>
          <div className="mt-4 flex gap-3">
            <button onClick={() => handleDelete(deleteId)} disabled={deleting} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50">
              {deleting ? "Deleting..." : "Yes, Delete"}
            </button>
            <button onClick={() => setDeleteId(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800">Cancel</button>
          </div>
        </div>
      )}

      {/* Events list */}
      <div className="rounded-2xl border border-gray-200/60 bg-white/70 shadow-sm backdrop-blur-sm">
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
          <>
            {/* Upcoming Events */}
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Upcoming Events</h2>
              <p className="text-xs text-gray-500 mt-0.5">{upcomingEvents.length} event{upcomingEvents.length !== 1 ? "s" : ""}</p>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <CalendarDays className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm font-semibold text-gray-500">No upcoming events</p>
                <p className="text-xs text-gray-400">Create a new event or check past events below.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-primary-50/30">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-700">
                      <span className="text-[9px] font-bold uppercase leading-none">{new Date(event.startAt).toLocaleDateString("en", { month: "short" })}</span>
                      <span className="text-base font-extrabold leading-tight">{new Date(event.startAt).getDate()}</span>
                    </div>
                    <Link to={`/events/${event.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900 hover:text-primary-600 transition-colors">{event.title}</p>
                      <p className="text-xs text-gray-400">{event.venueName ?? "No venue"}</p>
                    </Link>
                    <div className="flex items-center gap-1.5">
                      {fbConnected && (
                        <button
                          onClick={(e) => openFbShare(event, e)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-blue-50 hover:text-[#1877F2]"
                          title="Share to Facebook"
                        >
                          <Facebook className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <Link
                        to={`/dashboard/events/${event.id}/edit`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-primary-50 hover:text-primary-600"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => setDeleteId(event.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <span className={`ml-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        event.status === "approved" ? "bg-emerald-50 text-emerald-600" :
                        event.status === "published" ? "bg-blue-50 text-blue-600" :
                        event.status === "rejected" ? "bg-red-50 text-red-600" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Past Events - collapsible */}
            {pastEvents.length > 0 && (
              <div className="border-t border-gray-200/60">
                <button
                  onClick={() => setShowPastEvents(!showPastEvents)}
                  className="flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-gray-50/80"
                >
                  <History className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-gray-700">Past Events</h2>
                    <p className="text-xs text-gray-500">{pastEvents.length} event{pastEvents.length !== 1 ? "s" : ""}</p>
                  </div>
                  {showPastEvents ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {showPastEvents && (
                  <div className="divide-y divide-gray-100 border-t border-gray-100">
                    {pastEvents.map((event) => (
                      <div key={event.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50/50 bg-gray-50/30">
                        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-gray-200/80 text-gray-600">
                          <span className="text-[9px] font-bold uppercase leading-none">{new Date(event.startAt).toLocaleDateString("en", { month: "short" })}</span>
                          <span className="text-base font-extrabold leading-tight">{new Date(event.startAt).getDate()}</span>
                        </div>
                        <Link to={`/events/${event.id}`} className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-gray-700 hover:text-primary-600 transition-colors">{event.title}</p>
                          <p className="text-xs text-gray-400">{event.venueName ?? "No venue"}</p>
                        </Link>
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/dashboard/events/${event.id}/edit`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => setDeleteId(event.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <span className={`ml-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            event.status === "approved" ? "bg-emerald-50 text-emerald-600" :
                            event.status === "published" ? "bg-blue-50 text-blue-600" :
                            event.status === "rejected" ? "bg-red-50 text-red-600" :
                            "bg-gray-100 text-gray-500"
                          }`}>
                            {event.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {fbShareEvent && (
        <FacebookShareModal
          event={fbShareEvent}
          onClose={() => setFbShareEvent(null)}
          onShared={() => {
            setFbShareEvent(null);
            alert("Posted to Facebook!");
          }}
        />
      )}
    </div>
  );
}
