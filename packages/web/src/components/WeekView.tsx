import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  parseISO,
} from "date-fns";
import clsx from "clsx";
import type { EventWithDetails } from "@cyh/shared";

interface WeekViewProps {
  events: EventWithDetails[];
  currentDate: Date;
  onEventClick?: (eventId: string) => void;
  selectedEventId?: string | null;
}

export function WeekView({ events, currentDate, onEventClick, selectedEventId }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const eventsByDate = new Map<string, EventWithDetails[]>();
  for (const event of events) {
    const key = event.startAt.slice(0, 10);
    const list = eventsByDate.get(key) ?? [];
    list.push(event);
    eventsByDate.set(key, list);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/70 shadow-sm backdrop-blur-sm">
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate.get(key) ?? [];
          const today = isToday(day);

          return (
            <div key={key} className="flex flex-col border-r border-gray-100/80 last:border-r-0">
              <div
                className={clsx(
                  "flex flex-col items-center border-b border-gray-100 px-2 py-3",
                  today && "bg-primary-50/60",
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {format(day, "EEE")}
                </span>
                <span
                  className={clsx(
                    "mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                    today ? "bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md shadow-primary-500/30" : "text-gray-800",
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              <div className="flex min-h-48 flex-col gap-2 p-2">
                {dayEvents.map((event) => {
                  const start = parseISO(event.startAt);
                  const primaryColor = event.categories[0]?.color ?? "#4f46e5";
                  const isSelected = selectedEventId === event.id;

                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick?.(event.id)}
                      className={clsx(
                        "group block w-full rounded-xl border bg-white/80 p-2.5 text-left transition-all hover:shadow-md hover:-translate-y-px",
                        isSelected
                          ? "border-primary-300 ring-2 ring-primary-200 shadow-md"
                          : "border-gray-100/80",
                      )}
                      style={{ borderLeftWidth: "3px", borderLeftColor: primaryColor }}
                    >
                      <p className={clsx(
                        "text-xs font-bold transition-colors",
                        isSelected ? "text-primary-600" : "text-gray-800 group-hover:text-primary-600",
                      )}>
                        {event.title}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                        {event.allDay ? "All day" : format(start, "h:mm a")}
                      </p>
                      {event.venueName && (
                        <p className="mt-0.5 truncate text-[11px] text-gray-300">
                          {event.venueName}
                        </p>
                      )}
                    </button>
                  );
                })}

                {dayEvents.length === 0 && (
                  <p className="flex flex-1 items-center justify-center text-[11px] font-medium text-gray-300">No events</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
