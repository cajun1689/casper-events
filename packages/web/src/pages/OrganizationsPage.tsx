import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building2, Globe, Mail, MapPin } from "lucide-react";
import { organizationsApi } from "@/lib/api";
import type { OrganizationPublic } from "@cyh/shared";

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<OrganizationPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    organizationsApi.list().then((res) => { setOrgs(res.data); setLoading(false); });
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Organizations</h1>
        <p className="mt-1 text-sm text-gray-500">Community groups and organizations sharing events</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : orgs.length === 0 ? (
        <div className="rounded-2xl border border-gray-200/60 bg-white/70 py-20 text-center shadow-sm backdrop-blur-sm">
          <p className="text-4xl mb-3">🏢</p>
          <p className="text-lg font-bold text-gray-400">No organizations yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <Link key={org.id} to={`/organizations/${org.slug}`} className="group rounded-2xl border border-gray-200/60 bg-white/70 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 hover:bg-white">
              <div className="flex items-center gap-4 mb-4">
                {org.logoUrl ? (
                  <img src={org.logoUrl} alt={org.name} className="h-12 w-12 rounded-xl object-cover ring-2 ring-gray-100" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-lg font-bold text-white shadow-md shadow-primary-500/20">
                    {org.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{org.name}</h2>
                </div>
              </div>
              {org.description && <p className="mb-4 text-sm text-gray-500 line-clamp-2">{org.description}</p>}
              <div className="space-y-1.5">
                {org.website && <p className="flex items-center gap-2 text-xs text-gray-400"><Globe className="h-3.5 w-3.5" /><span className="truncate">{org.website}</span></p>}
                {org.email && <p className="flex items-center gap-2 text-xs text-gray-400"><Mail className="h-3.5 w-3.5" />{org.email}</p>}
                {org.address && <p className="flex items-center gap-2 text-xs text-gray-400"><MapPin className="h-3.5 w-3.5" /><span className="truncate">{org.address}</span></p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
