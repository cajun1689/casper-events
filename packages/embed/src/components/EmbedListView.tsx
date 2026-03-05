import { useState } from "react";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import type { EmbedEvent } from "../types";
import { EmbedEventDetail } from "./EmbedEventDetail";

interface EmbedListViewProps {
  events: EmbedEvent[];
}

function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, MMMM d");
}

function groupEventsByDate(events: EmbedEvent[]): Map<string, EmbedEvent[]> {
  const groups = new Map<string, EmbedEvent[]>();
  const sorted = [...events].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
  for (const event of sorted) {
    const key = format(parseISO(event.startAt), "yyyy-MM-dd");
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }
  return groups;
}

export function EmbedListView({ events }: EmbedListViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const grouped = groupEventsByDate(events);

  if (events.length === 0) {
    return (
      <div style={{
        padding: "32px 16px",
        textAlign: "center",
        color: "color-mix(in srgb, var(--cyh-text, #1f2937) 50%, transparent)",
        fontSize: "13px",
      }}>
        No upcoming events
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {Array.from(grouped.entries()).map(([dateKey, dayEvents]) => (
        <div key={dateKey}>
          <div style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--cyh-primary, #2563eb)",
            marginBottom: "8px",
            padding: "0 2px",
          }}>
            {formatDateLabel(dayEvents[0].startAt)}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {dayEvents.map((event) => {
              const isExpanded = expandedId === event.id;

              return (
                <div key={event.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : event.id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      width: "100%",
                      padding: "10px",
                      border: "1px solid var(--cyh-border, #e5e7eb)",
                      borderRadius: "var(--cyh-radius, 6px)",
                      backgroundColor: isExpanded
                        ? "color-mix(in srgb, var(--cyh-primary, #2563eb) 5%, var(--cyh-bg, #ffffff))"
                        : "var(--cyh-bg, #ffffff)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background-color 0.15s, border-color 0.15s",
                      borderColor: isExpanded
                        ? "color-mix(in srgb, var(--cyh-primary, #2563eb) 30%, var(--cyh-border, #e5e7eb))"
                        : "var(--cyh-border, #e5e7eb)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.borderColor =
                          "color-mix(in srgb, var(--cyh-primary, #2563eb) 25%, var(--cyh-border, #e5e7eb))";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.borderColor = "var(--cyh-border, #e5e7eb)";
                      }
                    }}
                  >
                    <div style={{
                      flexShrink: 0,
                      width: "42px",
                      paddingTop: "1px",
                    }}>
                      <div style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--cyh-primary, #2563eb)",
                        lineHeight: 1.3,
                      }}>
                        {event.allDay
                          ? "All day"
                          : format(parseISO(event.startAt), "h:mm a")}
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--cyh-text, #1f2937)",
                        lineHeight: 1.3,
                        marginBottom: "4px",
                      }}>
                        {event.title}
                      </div>

                      {event.venueName && (
                        <div style={{
                          fontSize: "12px",
                          color: "color-mix(in srgb, var(--cyh-text, #1f2937) 60%, transparent)",
                          marginBottom: "4px",
                        }}>
                          {event.venueName}
                        </div>
                      )}

                      {event.categories.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {event.categories.map((cat) => (
                            <span
                              key={cat.id}
                              style={{
                                display: "inline-block",
                                padding: "1px 6px",
                                borderRadius: "9999px",
                                fontSize: "10px",
                                fontWeight: 600,
                                backgroundColor: cat.color
                                  ? `color-mix(in srgb, ${cat.color} 15%, var(--cyh-bg, #ffffff))`
                                  : "color-mix(in srgb, var(--cyh-primary, #2563eb) 10%, var(--cyh-bg, #ffffff))",
                                color: cat.color ?? "var(--cyh-primary, #2563eb)",
                              }}
                            >
                              {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div style={{ padding: "0 4px", marginTop: "4px" }}>
                      <EmbedEventDetail event={event} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
