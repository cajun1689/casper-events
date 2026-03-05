import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import clsx from "clsx";
import type { EventWithDetails } from "@cyh/shared";

interface MonthViewProps {
  events: EventWithDetails[];
  currentDate: Date;
  onDateClick: (date: Date) => void;
}

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthView({ events, currentDate, onDateClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const eventsByDate = new Map<string, EventWithDetails[]>();
  for (const event of events) {
    const key = format(parseISO(event.startAt), "yyyy-MM-dd");
    const list = eventsByDate.get(key) ?? [];
    list.push(event);
    eventsByDate.set(key, list);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {DAY_HEADERS.map((day) => (
          <div key={day} className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
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
                "group relative flex min-h-24 flex-col border-b border-r border-gray-100 p-2 text-left transition-colors hover:bg-primary-50/50",
                !inMonth && "bg-gray-50/50",
              )}
            >
              <span
                className={clsx(
                  "mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                  today && "bg-primary-600 text-white",
                  !today && inMonth && "text-gray-900",
                  !today && !inMonth && "text-gray-400",
                )}
              >
                {format(day, "d")}
              </span>

              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="truncate rounded px-1.5 py-0.5 text-[11px] font-medium leading-tight"
                    style={{
                      backgroundColor: event.categories[0]?.color
                        ? `${event.categories[0].color}20`
                        : "#2563eb20",
                      color: event.categories[0]?.color ?? "#2563eb",
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[11px] font-medium text-gray-400">
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
