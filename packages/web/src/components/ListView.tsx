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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200/60 bg-white/70 py-20 text-center shadow-sm backdrop-blur-sm">
        <div className="mb-3 text-4xl">📭</div>
        <p className="text-lg font-bold text-gray-400">No events found</p>
        <p className="mt-1 text-sm text-gray-400">Try adjusting your filters or date range.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {sortedDates.map((dateKey, i) => {
        const dayEvents = grouped.get(dateKey)!;
        const date = parseISO(dateKey);

        return (
          <section key={dateKey} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/20">
                <span className="text-[10px] font-bold uppercase leading-none tracking-wider opacity-80">
                  {format(date, "MMM")}
                </span>
                <span className="text-xl font-extrabold leading-tight">
                  {format(date, "d")}
                </span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  {format(date, "EEEE, MMMM d, yyyy")}
                </h2>
                <p className="text-xs font-medium text-gray-400">
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
