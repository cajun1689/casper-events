import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, CalendarCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useStore } from "@/lib/store";
import { adminApi } from "@/lib/api";
import type { EventWithDetails } from "@cyh/shared";

export default function AdminReviewPage() {
  const { token, user } = useStore();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user?.isAdmin) { navigate("/"); return; }
    adminApi.pendingEvents().then((res) => { setEvents(res.data); setLoading(false); });
  }, [token, user, navigate]);

  async function review(id: string, decision: string) {
    await adminApi.reviewEvent(id, { decision });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  async function bulkApprove() {
    const ids = events.map((e) => e.id);
    await adminApi.bulkReview({ eventIds: ids, decision: "approved" });
    setEvents([]);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-fade-in">
      <Link to="/admin" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Admin Dashboard
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg">
            <CalendarCheck className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Review Events</h1>
        </div>
        {events.length > 1 && (
          <button onClick={bulkApprove} className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:-translate-y-px">
            Approve All ({events.length})
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-gray-200/60 bg-white/70 py-20 text-center shadow-sm backdrop-blur-sm">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-lg font-bold text-gray-400">All caught up!</p>
          <p className="text-sm text-gray-400 mt-1">No events pending review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-gray-200/60 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-all hover:shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link to={`/events/${event.id}`} className="text-base font-bold text-gray-900 hover:text-primary-600 transition-colors">{event.title}</Link>
                  <p className="mt-1 text-sm text-gray-500">{event.organization?.name} · {format(parseISO(event.startAt), "MMM d, yyyy 'at' h:mm a")}</p>
                  {event.venueName && <p className="mt-0.5 text-xs text-gray-400">{event.venueName}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => review(event.id, "approved")} className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-600 transition-all hover:bg-emerald-100">
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                  <button onClick={() => review(event.id, "rejected")} className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-100">
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
