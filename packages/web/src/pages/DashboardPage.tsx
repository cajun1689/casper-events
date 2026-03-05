import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  Plus,
  Calendar,
  Code,
  Settings,
  Copy,
  Check,
  LogOut,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { eventsApi } from "@/lib/api";
import type { EventWithDetails } from "@cyh/shared";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { token, user, organization, logout } = useStore();

  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!organization) return;
    eventsApi
      .list({ orgId: organization.id })
      .then((res) => setEvents(res.data))
      .catch((err) => console.error("Failed to load events:", err))
      .finally(() => setLoading(false));
  }, [organization]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const embedSnippet = organization
    ? `<iframe
  src="${window.location.origin}/embed/${organization.slug}"
  width="100%"
  height="600"
  frameborder="0"
  style="border:0;border-radius:8px"
></iframe>`
    : "";

  function handleCopyEmbed() {
    navigator.clipboard.writeText(embedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  const publishedCount = events.filter(
    (e) => e.status === "published" || e.status === "approved"
  ).length;
  const pendingCount = events.filter((e) => e.status === "draft").length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          {organization && (
            <p className="text-sm text-gray-500 mt-1">{organization.name}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/events/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Total Events</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {events.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Published</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {publishedCount}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Pending Review</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">
            {pendingCount}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Events list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              My Events
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <p className="text-gray-500 mb-4">No events yet.</p>
              <Link
                to="/dashboard/events/new"
                className="text-blue-600 font-medium hover:underline"
              >
                Create your first event
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
              {events.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {event.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(event.startAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 ml-4 text-xs font-medium px-2.5 py-1 rounded-full ${
                      event.status === "approved" || event.status === "published"
                        ? "bg-green-50 text-green-700"
                        : event.status === "rejected"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {event.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Embed code */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Code className="w-4 h-4 text-gray-400" />
              Embed Code
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Add this snippet to your website to display your events calendar.
            </p>
            <div className="relative">
              <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto font-mono">
                {embedSnippet}
              </pre>
              <button
                onClick={handleCopyEmbed}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-gray-400" />
              Quick Links
            </h3>
            <nav className="space-y-1">
              <Link
                to="/dashboard/settings"
                className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                Organization Settings
              </Link>
              {organization && (
                <Link
                  to={`/organizations/${organization.slug}`}
                  className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  View Public Profile
                </Link>
              )}
            </nav>
          </div>

          {/* User info */}
          {user && (
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
              Signed in as <span className="font-medium">{user.email}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
