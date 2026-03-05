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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-500 backdrop-blur-sm transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        {event.imageUrl && (
          <div className="aspect-[2/1] overflow-hidden rounded-t-2xl bg-gray-100">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-8">
          {event.categories.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {event.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: cat.color ? `${cat.color}18` : "#2563eb18",
                    color: cat.color ?? "#2563eb",
                  }}
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          <h2 className="mb-4 text-2xl font-bold text-gray-900">{event.title}</h2>

          <div className="mb-6 space-y-3">
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{format(start, "EEEE, MMMM d, yyyy")}</p>
                {event.allDay ? (
                  <p>All day</p>
                ) : (
                  <p className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {format(start, "h:mm a")}
                    {end && ` – ${format(end, "h:mm a")}`}
                  </p>
                )}
              </div>
            </div>

            {(event.venueName || event.address) && (
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  {event.venueName && (
                    <p className="font-medium text-gray-900">{event.venueName}</p>
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
                      <p>{event.address}</p>
                    )
                  )}
                </div>
              </div>
            )}

            {event.cost && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <DollarSign className="h-4 w-4 shrink-0 text-gray-400" />
                <span>{event.cost}</span>
              </div>
            )}
          </div>

          {event.description && (
            <div className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {event.description}
            </div>
          )}

          {event.ticketUrl && (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
            >
              <Ticket className="h-4 w-4" />
              Get Tickets
            </a>
          )}

          <div className="border-t border-gray-100 pt-5">
            <Link
              to={`/organizations/${event.organization.slug}`}
              className="group flex items-center gap-3"
            >
              {event.organization.logoUrl ? (
                <img
                  src={event.organization.logoUrl}
                  alt={event.organization.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                  {event.organization.name.charAt(0)}
                </span>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-primary-600">
                  {event.organization.name}
                </p>
                <p className="flex items-center gap-1 text-xs text-gray-500">
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
