import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import clsx from "clsx";
import { Link } from "react-router-dom";
import type { EventWithDetails } from "@cyh/shared";

interface WeekViewProps {
  events: EventWithDetails[];
  currentDate: Date;
}

export function WeekView({ events, currentDate }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const eventsByDate = new Map<string, EventWithDetails[]>();
  for (const event of events) {
    const key = format(parseISO(event.startAt), "yyyy-MM-dd");
    const list = eventsByDate.get(key) ?? [];
    list.push(event);
    eventsByDate.set(key, list);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate.get(key) ?? [];
          const today = isToday(day);

          return (
            <div key={key} className="flex flex-col border-r border-gray-100 last:border-r-0">
              <div
                className={clsx(
                  "flex flex-col items-center border-b border-gray-200 px-2 py-3",
                  today ? "bg-primary-50" : "bg-gray-50",
                )}
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {format(day, "EEE")}
                </span>
                <span
                  className={clsx(
                    "mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                    today ? "bg-primary-600 text-white" : "text-gray-900",
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              <div className="flex min-h-48 flex-col gap-1.5 p-2">
                {dayEvents.map((event) => {
                  const start = parseISO(event.startAt);
                  const primaryColor = event.categories[0]?.color ?? "#2563eb";

                  return (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="group block rounded-lg border-l-[3px] bg-gray-50 p-2 transition-all hover:bg-gray-100 hover:shadow-sm"
                      style={{ borderLeftColor: primaryColor }}
                    >
                      <p className="text-xs font-semibold text-gray-900 group-hover:text-primary-600">
                        {event.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {event.allDay ? "All day" : format(start, "h:mm a")}
                      </p>
                      {event.venueName && (
                        <p className="mt-0.5 truncate text-[11px] text-gray-400">
                          {event.venueName}
                        </p>
                      )}
                    </Link>
                  );
                })}

                {dayEvents.length === 0 && (
                  <p className="py-4 text-center text-xs text-gray-300">No events</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
