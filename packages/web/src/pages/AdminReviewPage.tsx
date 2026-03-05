import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { useStore } from "@/lib/store";
import { adminApi } from "@/lib/api";
import type { EventWithDetails } from "@cyh/shared";

export default function AdminReviewPage() {
  const { user } = useStore();
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  useEffect(() => {
    adminApi
      .pendingEvents()
      .then((res) => setEvents(res.data))
      .catch((err) => console.error("Failed to load pending events:", err))
      .finally(() => setLoading(false));
  }, []);

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const allSelected =
    events.length > 0 && selected.size === events.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(events.map((e) => e.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleNotes(id: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleReview(id: string, decision: "approved" | "rejected") {
    setProcessing((p) => new Set(p).add(id));
    try {
      await adminApi.reviewEvent(id, { decision, notes: notes[id] });
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error("Review failed:", err);
    } finally {
      setProcessing((p) => {
        const next = new Set(p);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleBulkReview(decision: "approved" | "rejected") {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    ids.forEach((id) => setProcessing((p) => new Set(p).add(id)));
    try {
      await adminApi.bulkReview({ eventIds: ids, decision });
      setEvents((prev) => prev.filter((e) => !ids.includes(e.id)));
      setSelected(new Set());
    } catch (err) {
      console.error("Bulk review failed:", err);
    } finally {
      setProcessing(new Set());
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/admin"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Pending Reviews</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">All caught up!</p>
          <p className="text-gray-500 mt-1">No events pending review.</p>
        </div>
      ) : (
        <>
          {/* Bulk actions bar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-3 mb-4 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Select all ({events.length})
            </label>
            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 mr-2">
                  {selected.size} selected
                </span>
                <button
                  onClick={() => handleBulkReview("approved")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleBulkReview("rejected")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
          </div>

          {/* Event cards */}
          <div className="space-y-4">
            {events.map((event) => {
              const isProcessing = processing.has(event.id);
              return (
                <div
                  key={event.id}
                  className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 transition-opacity ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selected.has(event.id)}
                      onChange={() => toggleSelect(event.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {event.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {event.organization.name} &middot;{" "}
                            {format(new Date(event.startAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => toggleNotes(event.id)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                            title="Add notes"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReview(event.id, "approved")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(event.id, "rejected")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>

                      {event.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {expandedNotes.has(event.id) && (
                        <textarea
                          value={notes[event.id] ?? ""}
                          onChange={(e) =>
                            setNotes((prev) => ({
                              ...prev,
                              [event.id]: e.target.value,
                            }))
                          }
                          placeholder="Add review notes (optional)..."
                          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={2}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
