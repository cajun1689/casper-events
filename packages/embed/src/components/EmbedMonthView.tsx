import { useState } from "react";
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
  addMonths,
  subMonths,
} from "date-fns";
import type { EmbedEvent } from "../types";
import { EmbedEventDetail } from "./EmbedEventDetail";

interface EmbedMonthViewProps {
  events: EmbedEvent[];
}

const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function EmbedMonthView({ events }: EmbedMonthViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const eventsByDate = new Map<string, EmbedEvent[]>();
  for (const event of events) {
    const key = format(parseISO(event.startAt), "yyyy-MM-dd");
    const list = eventsByDate.get(key) ?? [];
    list.push(event);
    eventsByDate.set(key, list);
  }

  const selectedEvents = selectedDate
    ? eventsByDate.get(format(selectedDate, "yyyy-MM-dd")) ?? []
    : [];

  return (
    <div>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 4px",
        marginBottom: "4px",
      }}>
        <button
          onClick={() => setCurrentDate((d) => subMonths(d, 1))}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: "var(--cyh-radius, 6px)",
            color: "var(--cyh-text, #1f2937)",
            fontSize: "16px",
            lineHeight: 1,
          }}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span style={{
          fontWeight: 600,
          fontSize: "14px",
          color: "var(--cyh-text, #1f2937)",
        }}>
          {format(currentDate, "MMMM yyyy")}
        </span>
        <button
          onClick={() => setCurrentDate((d) => addMonths(d, 1))}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: "var(--cyh-radius, 6px)",
            color: "var(--cyh-text, #1f2937)",
            fontSize: "16px",
            lineHeight: 1,
          }}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "1px",
        backgroundColor: "var(--cyh-border, #e5e7eb)",
        borderRadius: "var(--cyh-radius, 6px)",
        overflow: "hidden",
        border: "1px solid var(--cyh-border, #e5e7eb)",
      }}>
        {DAY_HEADERS.map((day) => (
          <div key={day} style={{
            padding: "6px 2px",
            textAlign: "center",
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "color-mix(in srgb, var(--cyh-text, #1f2937) 50%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--cyh-bg, #ffffff) 95%, var(--cyh-text, #1f2937))",
          }}>
            {day}
          </div>
        ))}

        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate.get(key) ?? [];
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const selected = selectedDate ? isSameDay(day, selectedDate) : false;

          return (
            <button
              key={key}
              onClick={() => setSelectedDate(
                selected ? null : day,
              )}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                padding: "6px 2px 4px",
                border: "none",
                cursor: "pointer",
                backgroundColor: selected
                  ? "color-mix(in srgb, var(--cyh-primary, #2563eb) 12%, var(--cyh-bg, #ffffff))"
                  : "var(--cyh-bg, #ffffff)",
                minHeight: "44px",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!selected) {
                  e.currentTarget.style.backgroundColor =
                    "color-mix(in srgb, var(--cyh-primary, #2563eb) 6%, var(--cyh-bg, #ffffff))";
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  e.currentTarget.style.backgroundColor = "var(--cyh-bg, #ffffff)";
                }
              }}
            >
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                fontSize: "12px",
                fontWeight: today ? 700 : 500,
                backgroundColor: today ? "var(--cyh-primary, #2563eb)" : "transparent",
                color: today
                  ? "#fff"
                  : inMonth
                    ? "var(--cyh-text, #1f2937)"
                    : "color-mix(in srgb, var(--cyh-text, #1f2937) 35%, transparent)",
              }}>
                {format(day, "d")}
              </span>

              {dayEvents.length > 0 && (
                <div style={{ display: "flex", gap: "2px" }}>
                  {dayEvents.slice(0, 3).map((event) => (
                    <span
                      key={event.id}
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        backgroundColor:
                          event.categories[0]?.color ?? "var(--cyh-primary, #2563eb)",
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div style={{ marginTop: "12px" }}>
          <div style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--cyh-text, #1f2937)",
            marginBottom: "8px",
            padding: "0 4px",
          }}>
            {format(selectedDate, "EEEE, MMMM d")}
          </div>
          {selectedEvents.length === 0 ? (
            <div style={{
              fontSize: "13px",
              color: "color-mix(in srgb, var(--cyh-text, #1f2937) 50%, transparent)",
              padding: "12px",
              textAlign: "center",
              backgroundColor: "color-mix(in srgb, var(--cyh-bg, #ffffff) 95%, var(--cyh-text, #1f2937))",
              borderRadius: "var(--cyh-radius, 6px)",
            }}>
              No events this day
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {selectedEvents.map((event) => (
                <EmbedEventDetail key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
