import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  format,
  parseISO,
  isSameDay,
} from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Tag,
  Building2,
  Pencil,
  Trash2,
  Share2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { eventsApi } from "@/lib/api";
import type { EventWithDetails } from "@cyh/shared";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organization } = useStore();

  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    eventsApi
      .get(id)
      .then(setEvent)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!id || !confirm("Are you sure you want to delete this event?")) return;
    try {
      await eventsApi.delete(id);
      navigate("/dashboard");
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  async function handleShareFacebook() {
    if (!id) return;
    setSharing(true);
    try {
      await eventsApi.shareToFacebook(id);
      alert("Shared to Facebook!");
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setSharing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 mb-4">{error || "Event not found"}</p>
        <Link to="/" className="text-blue-600 hover:underline">
          Back to Calendar
        </Link>
      </div>
    );
  }

  const start = parseISO(event.startAt);
  const end = event.endAt ? parseISO(event.endAt) : null;
  const isOwner = organization?.id === event.orgId;

  const dateDisplay = event.allDay
    ? format(start, "EEEE, MMMM d, yyyy")
    : format(start, "EEEE, MMMM d, yyyy");

  const timeDisplay = event.allDay
    ? "All Day"
    : end && !isSameDay(start, end)
      ? `${format(start, "h:mm a")} – ${format(end, "MMM d, h:mm a")}`
      : end
        ? `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`
        : format(start, "h:mm a");

  const mapsUrl = event.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Calendar
      </Link>

      {/* Banner image */}
      {event.imageUrl && (
        <div className="rounded-xl overflow-hidden mb-8">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-64 sm:h-80 object-cover"
          />
        </div>
      )}

      <article className="space-y-8">
        {/* Title & owner actions */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>

          {isOwner && (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={`/dashboard/events/${event.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Meta grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{dateDisplay}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {timeDisplay}
              </p>
            </div>
          </div>

          {(event.venueName || event.address) && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                {event.venueName && (
                  <p className="font-medium text-gray-900">
                    {event.venueName}
                  </p>
                )}
                {event.address && mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    {event.address}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : event.address ? (
                  <p className="text-sm text-gray-500">{event.address}</p>
                ) : null}
              </div>
            </div>
          )}

          {event.cost && (
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-900">{event.cost}</p>
                {event.ticketUrl && (
                  <a
                    href={event.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Get Tickets
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <Link
                to={`/organizations/${event.organization.slug}`}
                className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
              >
                {event.organization.name}
              </Link>
            </div>
          </div>
        </div>

        {/* Categories */}
        {event.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.categories.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: cat.color
                    ? `${cat.color}18`
                    : "rgb(243 244 246)",
                  color: cat.color || "rgb(75 85 99)",
                }}
              >
                {cat.icon && <span>{cat.icon}</span>}
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {event.description}
            </p>
          </div>
        )}

        {/* Share button */}
        {isOwner && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleShareFacebook}
              disabled={sharing}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1877F2] rounded-lg hover:bg-[#166FE5] transition-colors disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              {sharing ? "Sharing…" : "Share to Facebook"}
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
