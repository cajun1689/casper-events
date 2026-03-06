import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, CalendarCheck, Building2, Tags, BarChart3 } from "lucide-react";
import { useStore } from "@/lib/store";
import { adminApi } from "@/lib/api";

export default function AdminPage() {
  const { token, user } = useStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<{ events: Record<string, number>; organizations: number } | null>(null);

  useEffect(() => {
    if (!token || !user?.isAdmin) { navigate("/"); return; }
    adminApi.stats().then(setStats);
  }, [token, user, navigate]);

  const cards = [
    { to: "/admin/events", label: "All Events", desc: "View, edit, or delete any event", icon: BarChart3, gradient: "from-orange-500 to-orange-600", count: stats?.events?.total },
    { to: "/admin/reviews", label: "Review Events", desc: "Approve or reject pending events", icon: CalendarCheck, gradient: "from-violet-500 to-violet-600", count: stats?.events?.draft },
    { to: "/admin/organizations", label: "Organizations", desc: "Manage organization status", icon: Building2, gradient: "from-blue-500 to-blue-600", count: stats?.organizations },
    { to: "/admin/categories", label: "Categories", desc: "Add or edit event categories", icon: Tags, gradient: "from-emerald-500 to-emerald-600" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-fade-in">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Manage the community calendar</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.to} to={card.to} className="group rounded-2xl border border-gray-200/60 bg-white/70 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 hover:bg-white">
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
              <card.icon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{card.label}</h2>
            <p className="mt-1 text-sm text-gray-500">{card.desc}</p>
            {card.count !== undefined && (
              <p className="mt-3 text-2xl font-extrabold text-gray-900">{card.count}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
