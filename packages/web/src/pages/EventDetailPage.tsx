import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Clock, CalendarDays, ExternalLink, Ticket, DollarSign, Building2, ArrowLeft, Share2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { eventsApi } from "@/lib/api";
import type { EventWithDetails } from "@cyh/shared";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    eventsApi.get(id).then((data) => { setEvent(data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="skeleton h-64 w-full mb-6 rounded-2xl" />
        <div className="skeleton h-8 w-2/3 mb-4" />
        <div className="skeleton h-4 w-1/2 mb-2" />
        <div className="skeleton h-4 w-1/3" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center animate-fade-in">
        <p className="text-4xl mb-3">🔍</p>
        <h1 className="text-xl font-extrabold text-gray-900">Event Not Found</h1>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary-600 hover:text-primary-700">← Back to calendar</Link>
      </div>
    );
  }

  const start = parseISO(event.startAt);
  const end = event.endAt ? parseISO(event.endAt) : null;
  const mapUrl = event.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}` : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in">
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back to calendar
      </Link>

      <article className="overflow-hidden rounded-3xl border border-gray-200/60 bg-white/80 shadow-xl shadow-gray-200/30 backdrop-blur-sm">
        {event.imageUrl && (
          <div className="aspect-[2.2/1] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
            <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="p-6 sm:p-10">
          {event.categories.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {event.categories.map((cat) => (
                <span key={cat.id} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: cat.color ? `${cat.color}14` : "#4f46e514", color: cat.color ?? "#4f46e5" }}>
                  {cat.icon && <span>{cat.icon}</span>} {cat.name}
                </span>
              ))}
            </div>
          )}

          <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-gray-900">{event.title}</h1>

          <div className="mb-8 space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50"><CalendarDays className="h-4 w-4 text-primary-500" /></div>
              <div>
                <p className="font-semibold text-gray-900">{format(start, "EEEE, MMMM d, yyyy")}</p>
                {event.allDay ? <p className="text-gray-500">All day</p> : (
                  <p className="flex items-center gap-1 text-gray-500"><Clock className="h-3.5 w-3.5" />{format(start, "h:mm a")}{end && ` – ${format(end, "h:mm a")}`}</p>
                )}
              </div>
            </div>
            {(event.venueName || event.address) && (
              <div className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50"><MapPin className="h-4 w-4 text-primary-500" /></div>
                <div>
                  {event.venueName && <p className="font-semibold text-gray-900">{event.venueName}</p>}
                  {event.address && (mapUrl ? <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-600 hover:underline">{event.address}<ExternalLink className="h-3 w-3" /></a> : <p className="text-gray-500">{event.address}</p>)}
                </div>
              </div>
            )}
            {event.cost && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50"><DollarSign className="h-4 w-4 text-primary-500" /></div>
                <span className="font-medium text-gray-700">{event.cost}</span>
              </div>
            )}
          </div>

          {event.description && <div className="mb-8 whitespace-pre-wrap text-sm leading-relaxed text-gray-600 border-t border-gray-100 pt-6">{event.description}</div>}

          <div className="flex flex-wrap gap-3">
            {event.ticketUrl && (
              <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-px">
                <Ticket className="h-4 w-4" /> Get Tickets
              </a>
            )}
            <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white/60 px-5 py-3 text-sm font-semibold text-gray-600 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <Link to={`/organizations/${event.organization.slug}`} className="group flex items-center gap-3">
              {event.organization.logoUrl ? (
                <img src={event.organization.logoUrl} alt={event.organization.name} className="h-11 w-11 rounded-xl object-cover ring-2 ring-gray-100" />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-bold text-white shadow-md shadow-primary-500/20">{event.organization.name.charAt(0)}</span>
              )}
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{event.organization.name}</p>
                <p className="flex items-center gap-1 text-xs font-medium text-gray-400"><Building2 className="h-3 w-3" />Organized by</p>
              </div>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
