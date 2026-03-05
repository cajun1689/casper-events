import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { useStore } from "@/lib/store";
import { adminApi } from "@/lib/api";
import type { OrganizationPublic } from "@cyh/shared";

const statusBadge: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  suspended: "bg-red-50 text-red-700",
};

export default function AdminOrgsPage() {
  const { user } = useStore();
  const [orgs, setOrgs] = useState<OrganizationPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .organizations()
      .then((res) => setOrgs(res.data))
      .catch((err) => console.error("Failed to load organizations:", err))
      .finally(() => setLoading(false));
  }, []);

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  async function handleStatusChange(id: string, status: string) {
    setMenuOpen(null);
    setUpdating(id);
    try {
      await adminApi.updateOrgStatus(id, status);
      setOrgs((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      );
    } catch (err) {
      console.error("Failed to update org status:", err);
    } finally {
      setUpdating(null);
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
        <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orgs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-500">No organizations found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">
                    Slug
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">
                    Created
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orgs.map((org) => (
                  <tr
                    key={org.id}
                    className={`hover:bg-gray-50 transition-colors ${updating === org.id ? "opacity-50" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {org.logoUrl ? (
                          <img
                            src={org.logoUrl}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                            {org.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium text-gray-900">
                          {org.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">
                      {org.slug}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge[org.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {org.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {(org as any).createdAt
                        ? format(new Date((org as any).createdAt), "MMM d, yyyy")
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() =>
                            setMenuOpen(menuOpen === org.id ? null : org.id)
                          }
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        {menuOpen === org.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-10">
                            {org.status !== "active" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(org.id, "active")
                                }
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                Activate
                              </button>
                            )}
                            {org.status !== "suspended" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(org.id, "suspended")
                                }
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
