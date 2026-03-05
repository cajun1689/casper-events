import { format, parseISO } from "date-fns";
import type { EventWithDetails } from "@cyh/shared";
import { EventCard } from "@/components/EventCard";

interface ListViewProps {
  events: EventWithDetails[];
}

export function ListView({ events }: ListViewProps) {
  const grouped = new Map<string, EventWithDetails[]>();

  for (const event of events) {
    const key = format(parseISO(event.startAt), "yyyy-MM-dd");
    const list = grouped.get(key) ?? [];
    list.push(event);
    grouped.set(key, list);
  }

  const sortedDates = [...grouped.keys()].sort();

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
        <p className="text-lg font-medium text-gray-400">No events found</p>
        <p className="mt-1 text-sm text-gray-400">Try adjusting your filters or date range.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedDates.map((dateKey) => {
        const dayEvents = grouped.get(dateKey)!;
        const date = parseISO(dateKey);

        return (
          <section key={dateKey}>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <span className="text-[11px] font-bold uppercase leading-none">
                  {format(date, "MMM")}
                </span>
                <span className="text-lg font-bold leading-tight">
                  {format(date, "d")}
                </span>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {format(date, "EEEE, MMMM d, yyyy")}
                </h2>
                <p className="text-xs text-gray-500">
                  {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dayEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
