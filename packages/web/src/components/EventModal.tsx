import { useEffect, useCallback } from "react";
import {
  X,
  MapPin,
  Clock,
  CalendarDays,
  ExternalLink,
  Ticket,
  DollarSign,
  Building2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import type { EventWithDetails } from "@cyh/shared";

interface EventModalProps {
  event: EventWithDetails | null;
  onClose: () => void;
}

export function EventModal({ event, onClose }: EventModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!event) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [event, handleKeyDown]);

  if (!event) return null;

  const start = parseISO(event.startAt);
  const end = event.endAt ? parseISO(event.endAt) : null;

  const mapUrl = event.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-md sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl animate-fade-in-scale rounded-3xl bg-white shadow-2xl shadow-gray-900/10">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-gray-700 hover:shadow"
        >
          <X className="h-5 w-5" />
        </button>

        {event.imageUrl && (
          <div className="aspect-[2/1] overflow-hidden rounded-t-3xl bg-gradient-to-br from-gray-100 to-gray-50">
            <img
              src={event.imageUrl}
              alt={event.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-8">
          {event.categories.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {event.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: cat.color ? `${cat.color}14` : "#4f46e514",
                    color: cat.color ?? "#4f46e5",
                  }}
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-gray-900">{event.title}</h2>

          <div className="mb-6 space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                <CalendarDays className="h-4 w-4 text-primary-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{format(start, "EEEE, MMMM d, yyyy")}</p>
                {event.allDay ? (
                  <p className="text-gray-500">All day</p>
                ) : (
                  <p className="flex items-center gap-1 text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    {format(start, "h:mm a")}
                    {end && ` – ${format(end, "h:mm a")}`}
                  </p>
                )}
              </div>
            </div>

            {(event.venueName || event.address) && (
              <div className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                  <MapPin className="h-4 w-4 text-primary-500" />
                </div>
                <div>
                  {event.venueName && (
                    <p className="font-semibold text-gray-900">{event.venueName}</p>
                  )}
                  {event.address && (
                    mapUrl ? (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                      >
                        {event.address}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-gray-500">{event.address}</p>
                    )
                  )}
                </div>
              </div>
            )}

            {event.cost && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                  <DollarSign className="h-4 w-4 text-primary-500" />
                </div>
                <span className="font-medium text-gray-700">{event.cost}</span>
              </div>
            )}
          </div>

          {event.description && (
            <div className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
              {event.description}
            </div>
          )}

          {event.ticketUrl && (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-px"
            >
              <Ticket className="h-4 w-4" />
              Get Tickets
            </a>
          )}

          <div className="border-t border-gray-100 pt-5">
            <Link
              to={`/organizations/${event.organization.slug}`}
              className="group flex items-center gap-3"
              onClick={onClose}
            >
              {event.organization.logoUrl ? (
                <img
                  src={event.organization.logoUrl}
                  alt={event.organization.name}
                  className="h-10 w-10 rounded-xl object-cover ring-2 ring-gray-100"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-bold text-white shadow-md shadow-primary-500/20">
                  {event.organization.name.charAt(0)}
                </span>
              )}
              <div>
                <p className="text-sm font-bold text-gray-900 transition-colors group-hover:text-primary-600">
                  {event.organization.name}
                </p>
                <p className="flex items-center gap-1 text-xs font-medium text-gray-400">
                  <Building2 className="h-3 w-3" />
                  Organized by
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
