import { Link } from "react-router-dom";
import { MapPin, Clock, CalendarDays, Repeat, Star } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { EventWithDetails } from "@cyh/shared";

interface EventCardProps {
  event: EventWithDetails;
}

export function EventCard({ event }: EventCardProps) {
  const start = parseISO(event.startAt);
  const timeDisplay = event.allDay ? "All day" : format(start, "h:mm a");
  const dateDisplay = format(start, "EEE, MMM d");

  return (
    <Link
      to={`/events/${event.id}`}
      className="group block overflow-hidden rounded-2xl border border-gray-200/60 bg-white/70 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 hover:bg-white"
    >
      {event.imageUrl && (
        <div className="aspect-[16/9] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}

      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {dateDisplay}
          </span>
          <span className="text-gray-200">·</span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {timeDisplay}
          </span>
          {event.recurrenceRule && (
            <>
              <span className="text-gray-200">·</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-primary-700">
                <Repeat className="h-3 w-3" />
                Recurring
              </span>
            </>
          )}
        </div>

        <div className="mb-1.5 flex items-start gap-2">
          <h3 className="flex-1 text-base font-bold text-gray-900 transition-colors group-hover:text-primary-600">
            {event.title}
          </h3>
          {event.featured && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              <Star className="h-3 w-3" />
              Featured
            </span>
          )}
        </div>

        <p className="mb-3 flex items-center gap-1.5 text-sm text-gray-500">
          {event.organization.logoUrl ? (
            <img
              src={event.organization.logoUrl}
              alt={event.organization.name}
              className="h-4 w-4 rounded-full object-cover ring-2 ring-white"
            />
          ) : (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-[9px] font-bold text-white">
              {event.organization.name.charAt(0)}
            </span>
          )}
          <span className="font-medium">{event.organization.name}</span>
        </p>

        {event.venueName && (
          <p className="mb-3 flex items-center gap-1.5 text-sm text-gray-400">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{event.venueName}</span>
          </p>
        )}

        {event.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {event.categories.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{
                  backgroundColor: cat.color ? `${cat.color}14` : "#4f46e514",
                  color: cat.color ?? "#4f46e5",
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
