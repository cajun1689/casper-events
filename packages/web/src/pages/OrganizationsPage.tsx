import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building2, Globe, ArrowRight } from "lucide-react";
import { organizationsApi } from "@/lib/api";
import type { OrganizationPublic } from "@cyh/shared";

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<OrganizationPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    organizationsApi
      .list()
      .then((res) => setOrgs(res.data))
      .catch((err) => console.error("Failed to load organizations:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Organizations</h1>

      {orgs.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          No organizations found.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {orgs.map((org) => (
            <Link
              key={org.id}
              to={`/organizations/${org.slug}`}
              className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-6 flex flex-col"
            >
              <div className="flex items-center gap-4 mb-4">
                {org.logoUrl ? (
                  <img
                    src={org.logoUrl}
                    alt={org.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                )}
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {org.name}
                </h2>
              </div>

              {org.description && (
                <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1">
                  {org.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                {org.website ? (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                    <Globe className="w-3.5 h-3.5" />
                    {new URL(org.website).hostname}
                  </span>
                ) : (
                  <span />
                )}
                <span className="text-sm text-blue-600 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  View
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
