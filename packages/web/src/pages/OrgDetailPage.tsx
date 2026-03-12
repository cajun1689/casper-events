import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Globe, Mail, MapPin, Phone, ArrowLeft } from "lucide-react";
import { organizationsApi, eventsApi } from "@/lib/api";
import type { OrganizationPublic, EventWithDetails } from "@cyh/shared";
import { ListView } from "@/components/ListView";

export default function OrgDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [org, setOrg] = useState<OrganizationPublic | null>(null);
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    organizationsApi.get(slug).then((data) => {
      setOrg(data);
      return eventsApi.list({ orgId: data.id });
    }).then((res) => {
      const now = new Date();
      const upcoming = res.data.filter((e) => new Date(e.startAt) >= now);
      setEvents(upcoming);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="skeleton h-40 w-full rounded-2xl mb-6" />
        <div className="skeleton h-6 w-1/3 mb-3" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center animate-fade-in">
        <p className="text-4xl mb-3">🏢</p>
        <h1 className="text-xl font-extrabold text-gray-900">Organization Not Found</h1>
        <Link to="/organizations" className="mt-4 inline-block text-sm font-semibold text-primary-600 hover:text-primary-700">← All organizations</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-fade-in">
      <Link to="/organizations" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> All organizations
      </Link>

      <div className="mb-8 rounded-2xl border border-gray-200/60 bg-white/70 p-6 shadow-sm backdrop-blur-sm sm:p-8">
        <div className="flex items-start gap-5">
          {org.logoUrl ? (
            <img src={org.logoUrl} alt={org.name} className="h-16 w-16 rounded-2xl object-cover ring-2 ring-gray-100" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-2xl font-bold text-white shadow-lg shadow-primary-500/20">
              {org.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{org.name}</h1>
            {org.description && <p className="mt-2 text-sm text-gray-500">{org.description}</p>}
            <div className="mt-3 flex flex-wrap gap-3">
              {org.website && <a href={org.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700"><Globe className="h-3.5 w-3.5" />Website</a>}
              {org.email && <a href={`mailto:${org.email}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700"><Mail className="h-3.5 w-3.5" />{org.email}</a>}
              {org.phone && <span className="inline-flex items-center gap-1.5 text-xs text-gray-500"><Phone className="h-3.5 w-3.5" />{org.phone}</span>}
              {org.address && <span className="inline-flex items-center gap-1.5 text-xs text-gray-500"><MapPin className="h-3.5 w-3.5" />{org.address}</span>}
            </div>
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-bold text-gray-900">Events by {org.name}</h2>
      <ListView events={events} />
    </div>
  );
}
