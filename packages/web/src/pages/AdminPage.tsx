import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ClipboardList,
  Building2,
  Tag,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { useStore } from "@/lib/store";
import { adminApi } from "@/lib/api";
import type { EventWithDetails } from "@cyh/shared";

interface Stats {
  events: Record<string, number>;
  organizations: number;
}

const statCards = [
  {
    label: "Total Events",
    key: "total",
    icon: ClipboardList,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Pending Review",
    key: "pending",
    icon: ClipboardList,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    label: "Approved",
    key: "approved",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    label: "Organizations",
    key: "organizations",
    icon: Building2,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
] as const;

const navLinks = [
  { label: "Pending Reviews", to: "/admin/reviews", icon: ClipboardList },
  { label: "Organizations", to: "/admin/organizations", icon: Building2 },
  { label: "Categories", to: "/admin/categories", icon: Tag },
];

export default function AdminPage() {
  const { user } = useStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingEvents, setPendingEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, pendingRes] = await Promise.all([
          adminApi.stats(),
          adminApi.pendingEvents(),
        ]);
        setStats(statsRes);
        setPendingEvents(pendingRes.data.slice(0, 5));
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  function getStatValue(key: string): number {
    if (!stats) return 0;
    if (key === "organizations") return stats.organizations;
    if (key === "total") {
      return Object.values(stats.events).reduce((a, b) => a + b, 0);
    }
    return stats.events[key] ?? 0;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <nav className="flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.key}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4"
                >
                  <div className={`${card.bg} rounded-lg p-2.5`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {card.label}
                    </p>
                    <p className={`text-3xl font-bold mt-1 ${card.color}`}>
                      {getStatValue(card.key)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pending review preview */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Review
              </h2>
              <Link
                to="/admin/reviews"
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {pendingEvents.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-500">
                No events pending review.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {event.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {event.organization.name} &middot;{" "}
                        {format(new Date(event.startAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Link
                      to="/admin/reviews"
                      className="shrink-0 ml-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
