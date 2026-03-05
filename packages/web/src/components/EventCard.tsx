import { Link } from "react-router-dom";
import { MapPin, Clock, CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { EventWithDetails } from "@cyh/shared";

interface EventCardProps {
  event: EventWithDetails;
}

export function EventCard({ event }: EventCardProps) {
  const start = parseISO(event.startAt);

  const timeDisplay = event.allDay
    ? "All day"
    : format(start, "h:mm a");

  const dateDisplay = format(start, "EEE, MMM d");

  return (
    <Link
      to={`/events/${event.id}`}
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      {event.imageUrl && (
        <div className="aspect-[16/9] overflow-hidden bg-gray-100">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      <div className="p-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{dateDisplay}</span>
          <span className="text-gray-300">·</span>
          <Clock className="h-3.5 w-3.5" />
          <span>{timeDisplay}</span>
        </div>

        <h3 className="mb-1 text-base font-semibold text-gray-900 transition-colors group-hover:text-primary-600">
          {event.title}
        </h3>

        <p className="mb-3 flex items-center gap-1 text-sm text-gray-500">
          {event.organization.logoUrl ? (
            <img
              src={event.organization.logoUrl}
              alt={event.organization.name}
              className="h-4 w-4 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-600">
              {event.organization.name.charAt(0)}
            </span>
          )}
          {event.organization.name}
        </p>

        {event.venueName && (
          <p className="mb-3 flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{event.venueName}</span>
          </p>
        )}

        {event.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {event.categories.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: cat.color ? `${cat.color}18` : "#2563eb18",
                  color: cat.color ?? "#2563eb",
                }}
              >
                {cat.icon && <span className="leading-none">{cat.icon}</span>}
                {cat.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
