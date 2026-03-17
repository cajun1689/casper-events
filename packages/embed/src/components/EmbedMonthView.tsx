import { useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday,
  addMonths, subMonths,
} from "date-fns";
import type { EmbedEvent, ContentToggles } from "../types";
import { EmbedEventDetail } from "./EmbedEventDetail";

interface EmbedMonthViewProps {
  events: EmbedEvent[];
  onMonthChange?: (date: Date) => void;
  firstDayOfWeek?: "sunday" | "monday";
  contentToggles?: ContentToggles;
}

const DAY_HEADERS_SUNDAY = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAY_HEADERS_MONDAY = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function EmbedMonthView({ events, onMonthChange, firstDayOfWeek = "sunday", contentToggles }: EmbedMonthViewProps) {
  const weekStartsOn = firstDayOfWeek === "monday" ? 1 : 0;
  const DAY_HEADERS = firstDayOfWeek === "monday" ? DAY_HEADERS_MONDAY : DAY_HEADERS_SUNDAY;
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const navigateMonth = (direction: 1 | -1) => {
    setCurrentDate((d) => {
      const next = direction === 1 ? addMonths(d, 1) : subMonths(d, 1);
      onMonthChange?.(next);
      return next;
    });
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const eventsByDate = new Map<string, EmbedEvent[]>();
  for (const event of events) {
    const key = event.startAt.slice(0, 10);
    const list = eventsByDate.get(key) ?? [];
    list.push(event);
    eventsByDate.set(key, list);
  }

  const selectedEvents = selectedDate
    ? eventsByDate.get(format(selectedDate, "yyyy-MM-dd")) ?? []
    : [];

  const navBtnStyle: React.CSSProperties = {
    background: "none",
    border: "1px solid var(--cyh-border, #e5e7eb)",
    cursor: "pointer",
    padding: "5px 10px",
    borderRadius: "8px",
    color: "var(--cyh-text, #1f2937)",
    fontSize: "16px",
    lineHeight: 1,
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 0",
        marginBottom: "8px",
      }}>
        <button onClick={() => navigateMonth(-1)} style={navBtnStyle} aria-label="Previous month">‹</button>
        <span style={{ fontWeight: 800, fontSize: "14px", color: "var(--cyh-text)", letterSpacing: "-0.01em" }}>
          {format(currentDate, "MMMM yyyy")}
        </span>
        <button onClick={() => navigateMonth(1)} style={navBtnStyle} aria-label="Next month">›</button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "1px",
        backgroundColor: "var(--cyh-border, #e5e7eb)",
        borderRadius: "var(--cyh-radius, 10px)",
        overflow: "hidden",
        border: "1px solid var(--cyh-border, #e5e7eb)",
      }}>
        {DAY_HEADERS.map((day) => (
          <div key={day} style={{
            padding: "8px 2px",
            textAlign: "center",
            fontSize: "10px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "color-mix(in srgb, var(--cyh-text, #1f2937) 40%, transparent)",
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
              onClick={() => setSelectedDate(selected ? null : day)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                padding: "7px 2px 5px",
                border: "none",
                cursor: "pointer",
                backgroundColor: selected
                  ? "color-mix(in srgb, var(--cyh-primary, #4f46e5) 10%, var(--cyh-bg, #ffffff))"
                  : "var(--cyh-bg, #ffffff)",
                minHeight: "48px",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!selected) e.currentTarget.style.backgroundColor = "var(--cyh-hover, color-mix(in srgb, var(--cyh-primary) 6%, var(--cyh-bg)))";
              }}
              onMouseLeave={(e) => {
                if (!selected) e.currentTarget.style.backgroundColor = "var(--cyh-bg, #ffffff)";
              }}
            >
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "26px",
                height: "26px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: today ? 800 : 600,
                background: today ? "linear-gradient(135deg, var(--cyh-primary, #4f46e5), color-mix(in srgb, var(--cyh-primary) 80%, #000))" : "transparent",
                color: today
                  ? "#fff"
                  : inMonth
                    ? "var(--cyh-text, #1f2937)"
                    : "color-mix(in srgb, var(--cyh-text, #1f2937) 30%, transparent)",
                boxShadow: today ? `0 2px 6px color-mix(in srgb, var(--cyh-primary) 30%, transparent)` : "none",
              }}>
                {format(day, "d")}
              </span>

              {dayEvents.length > 0 && (
                <div style={{ display: "flex", gap: "2px" }}>
                  {dayEvents.slice(0, 3).map((event) => (
                    <span key={event.id} style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      backgroundColor: event.categories?.[0]?.color ?? "var(--cyh-primary, #4f46e5)",
                    }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div style={{ marginTop: "14px", animation: "cyh-fade-in 0.25s ease-out" }}>
          <div style={{
            fontSize: "12px",
            fontWeight: 800,
            color: "var(--cyh-text)",
            marginBottom: "10px",
            padding: "0 4px",
            letterSpacing: "-0.01em",
          }}>
            {format(selectedDate, "EEEE, MMMM d")}
          </div>
          {selectedEvents.length === 0 ? (
            <div style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "color-mix(in srgb, var(--cyh-text) 45%, transparent)",
              padding: "16px",
              textAlign: "center",
              backgroundColor: "color-mix(in srgb, var(--cyh-bg) 95%, var(--cyh-text))",
              borderRadius: "var(--cyh-radius, 10px)",
            }}>
              No events this day
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {selectedEvents.map((event) => (
                <EmbedEventDetail key={event.id} event={event} contentToggles={contentToggles} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
