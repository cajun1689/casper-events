import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useStore } from "@/lib/store";
import { adminApi, eventsApi } from "@/lib/api";
import type { EventWithDetails } from "@cyh/shared";

export default function AdminEventsPage() {
  const { token, user } = useStore();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!token || !user?.isAdmin) { navigate("/"); return; }
    adminApi.organizations().then((res) => {
      setOrgs(res.data.map((o: { id: string; name: string }) => ({ id: o.id, name: o.name })));
    });
  }, [token, user, navigate]);

  useEffect(() => {
    if (!token || !user?.isAdmin) return;
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: "25" };
    if (search) params.search = search;
    if (statusFilter !== "all") params.status = statusFilter;
    if (orgFilter !== "all") params.orgId = orgFilter;

    eventsApi.list(params).then((res) => {
      setEvents(res.data);
      setTotalPages(res.totalPages);
      setLoading(false);
    });
  }, [token, user, page, search, statusFilter, orgFilter]);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await eventsApi.delete(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  const statusColors: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-600",
    published: "bg-blue-50 text-blue-600",
    draft: "bg-gray-100 text-gray-500",
    rejected: "bg-red-50 text-red-600",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 animate-fade-in">
      <Link to="/admin" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Admin Dashboard
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
          <CalendarDays className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">All Events</h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-all focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100"
            placeholder="Search events..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="approved">Approved</option>
          <option value="draft">Draft</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={orgFilter}
          onChange={(e) => { setOrgFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700"
        >
          <option value="all">All Organizations</option>
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
      </div>

      {deleteId && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
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

      <div className="rounded-2xl border border-gray-200/60 bg-white/70 shadow-sm backdrop-blur-sm">
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-14 w-full" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm font-semibold text-gray-400">No events found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map((event) => (
              <div key={event.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-primary-50/20">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-700">
                  <span className="text-[9px] font-bold uppercase leading-none">{new Date(event.startAt).toLocaleDateString("en", { month: "short" })}</span>
                  <span className="text-base font-extrabold leading-tight">{new Date(event.startAt).getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/events/${event.id}`} className="truncate text-sm font-bold text-gray-900 hover:text-primary-600 transition-colors">
                    {event.title}
                  </Link>
                  <p className="text-xs text-gray-400">
                    {event.organization?.name || "Unknown org"} · {format(parseISO(event.startAt), "MMM d, yyyy")}
                    {event.venueName ? ` · ${event.venueName}` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusColors[event.status] || "bg-gray-100 text-gray-500"}`}>
                  {event.status}
                </span>
                <div className="flex shrink-0 gap-1">
                  <Link
                    to={`/dashboard/events/${event.id}/edit?from=admin`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteId(event.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
