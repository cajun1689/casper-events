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
  const sorted = [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
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
        padding: "40px 16px",
        textAlign: "center",
        color: "color-mix(in srgb, var(--cyh-text, #1f2937) 45%, transparent)",
        fontSize: "13px",
        fontWeight: 600,
      }}>
        No upcoming events
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {Array.from(grouped.entries()).map(([dateKey, dayEvents]) => (
        <div key={dateKey} style={{ animation: "cyh-fade-in 0.3s ease-out" }}>
          <div style={{
            fontSize: "10px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--cyh-primary, #4f46e5)",
            marginBottom: "8px",
            padding: "0 2px",
          }}>
            {formatDateLabel(dayEvents[0].startAt)}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {dayEvents.map((event) => {
              const isExpanded = expandedId === event.id;
              return (
                <div key={event.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : event.id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      width: "100%",
                      padding: "12px",
                      border: "1px solid",
                      borderRadius: "var(--cyh-radius, 10px)",
                      backgroundColor: isExpanded
                        ? "color-mix(in srgb, var(--cyh-primary, #4f46e5) 5%, var(--cyh-bg, #ffffff))"
                        : "var(--cyh-bg, #ffffff)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                      borderColor: isExpanded
                        ? "color-mix(in srgb, var(--cyh-primary, #4f46e5) 25%, var(--cyh-border, #e5e7eb))"
                        : "var(--cyh-border, #e5e7eb)",
                      boxShadow: isExpanded
                        ? "0 2px 8px color-mix(in srgb, var(--cyh-primary) 8%, transparent)"
                        : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) e.currentTarget.style.borderColor = "color-mix(in srgb, var(--cyh-primary) 20%, var(--cyh-border))";
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) e.currentTarget.style.borderColor = "var(--cyh-border, #e5e7eb)";
                    }}
                  >
                    <div style={{ flexShrink: 0, width: "48px", paddingTop: "1px" }}>
                      <div style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--cyh-primary, #4f46e5)",
                        lineHeight: 1.3,
                      }}>
                        {event.allDay ? "All day" : format(parseISO(event.startAt), "h:mm a")}
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--cyh-text, #1f2937)",
                        lineHeight: 1.3,
                        marginBottom: "4px",
                        letterSpacing: "-0.01em",
                      }}>
                        {event.title}
                      </div>

                      {event.venueName && (
                        <div style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "color-mix(in srgb, var(--cyh-text, #1f2937) 50%, transparent)",
                          marginBottom: "5px",
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
                                padding: "2px 8px",
                                borderRadius: "9999px",
                                fontSize: "10px",
                                fontWeight: 700,
                                backgroundColor: cat.color
                                  ? `color-mix(in srgb, ${cat.color} 12%, var(--cyh-bg, #ffffff))`
                                  : "color-mix(in srgb, var(--cyh-primary, #4f46e5) 10%, var(--cyh-bg, #ffffff))",
                                color: cat.color ?? "var(--cyh-primary, #4f46e5)",
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
                    <div style={{ padding: "0 4px", marginTop: "6px", animation: "cyh-scale-in 0.2s ease-out" }}>
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
