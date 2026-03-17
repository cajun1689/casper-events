import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from "date-fns";
import clsx from "clsx";
import type { EventWithDetails } from "@cyh/shared";

interface MonthViewProps {
  events: EventWithDetails[];
  currentDate: Date;
  onDateClick: (date: Date) => void;
  onEventClick?: (eventId: string) => void;
  selectedEventId?: string | null;
}

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthView({ events, currentDate, onDateClick, onEventClick, selectedEventId }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const eventsByDate = new Map<string, EventWithDetails[]>();
  for (const event of events) {
    const key = event.startAt.slice(0, 10);
    const list = eventsByDate.get(key) ?? [];
    list.push(event);
    eventsByDate.set(key, list);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/70 shadow-sm backdrop-blur-sm">
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_HEADERS.map((day) => (
          <div key={day} className="px-2 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-gray-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate.get(key) ?? [];
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <button
              key={key}
              onClick={() => onDateClick(day)}
              className={clsx(
                "group relative flex min-h-24 flex-col border-b border-r border-gray-100/80 p-2 text-left transition-colors",
                !inMonth && "bg-gray-50/30",
                inMonth && "hover:bg-primary-50/40",
              )}
            >
              <span
                className={clsx(
                  "mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  today && "bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md shadow-primary-500/30",
                  !today && inMonth && "text-gray-800 group-hover:text-primary-600",
                  !today && !inMonth && "text-gray-300",
                )}
              >
                {format(day, "d")}
              </span>

              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.stopPropagation(); onEventClick?.(event.id); }
                    }}
                    className={clsx(
                      "truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-tight transition-all",
                      selectedEventId === event.id
                        ? "ring-2 ring-primary-400 ring-offset-1"
                        : "hover:opacity-80",
                    )}
                    style={{
                      backgroundColor: event.categories[0]?.color
                        ? `${event.categories[0].color}18`
                        : "#4f46e518",
                      color: event.categories[0]?.color ?? "#4f46e5",
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] font-bold text-gray-400">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
