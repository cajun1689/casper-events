import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Globe,
  Mail,
  Phone,
  MapPin,
  Building2,
} from "lucide-react";
import { organizationsApi, eventsApi } from "@/lib/api";
import type { OrganizationPublic, EventWithDetails } from "@cyh/shared";
import { ListView } from "@/components/ListView";

export default function OrgDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const [org, setOrg] = useState<OrganizationPublic | null>(null);
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    organizationsApi
      .get(slug)
      .then(async (orgData) => {
        setOrg(orgData);
        const eventsRes = await eventsApi.list({ orgId: orgData.id });
        setEvents(eventsRes.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 mb-4">
          {error || "Organization not found"}
        </p>
        <Link to="/organizations" className="text-blue-600 hover:underline">
          Back to Organizations
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        to="/organizations"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        All Organizations
      </Link>

      {/* Org header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {org.logoUrl ? (
            <img
              src={org.logoUrl}
              alt={org.name}
              className="w-20 h-20 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Building2 className="w-10 h-10 text-blue-600" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {org.name}
            </h1>

            {org.description && (
              <p className="text-gray-600 mb-4">{org.description}</p>
            )}

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
              {org.website && (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  {new URL(org.website).hostname}
                </a>
              )}
              {org.email && (
                <a
                  href={`mailto:${org.email}`}
                  className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {org.email}
                </a>
              )}
              {org.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  {org.phone}
                </span>
              )}
              {org.address && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {org.address}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Events section */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Events</h2>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-500">
            No upcoming events from this organization.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          <ListView events={events} />
        </div>
      )}
    </div>
  );
}
