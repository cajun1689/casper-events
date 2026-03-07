import React, { useState, useRef, useCallback } from "react";
import { format, parseISO } from "date-fns";
import type { EmbedEvent } from "../types";
import { resolveEventColor, getTextColor } from "../lib/color";
import { EmbedPosterDetail } from "./EmbedPosterDetail";
import { EmbedPosterFilters } from "./EmbedPosterFilters";

interface EmbedPosterViewProps {
  events: EmbedEvent[];
  categories: { id: string; name: string; slug: string; color: string | null }[];
  onEventClick?: (event: EmbedEvent) => void;
}

function groupEventsByMonth(events: EmbedEvent[]): Map<string, EmbedEvent[]> {
  const groups = new Map<string, EmbedEvent[]>();
  const sorted = [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  for (const event of sorted) {
    const key = format(parseISO(event.startAt), "yyyy-MM");
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }
  return groups;
}

export function EmbedPosterView({
  events,
  categories,
  onEventClick,
}: EmbedPosterViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<EmbedEvent | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToMonth = useCallback((monthKey: string) => {
    const el = monthRefs.current[monthKey];
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const filteredEvents =
    categoryFilter.length === 0
      ? events
      : events.filter((e) =>
          (e.categories ?? []).some((c) => categoryFilter.includes(c.slug))
        );

  const grouped = groupEventsByMonth(filteredEvents);

  const handleCardClick = (event: EmbedEvent) => {
    if (onEventClick) {
      onEventClick(event);
    } else {
      setSelectedEvent(event);
    }
  };

  if (events.length === 0) {
    return (
      <div
        style={{
          padding: "40px 16px",
          textAlign: "center",
          color: "color-mix(in srgb, var(--cyh-text, #1f2937) 45%, transparent)",
          fontSize: "13px",
          fontWeight: 600,
        }}
      >
        No upcoming events
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <EmbedPosterFilters
        events={events}
        categories={categories}
        onMonthSelect={scrollToMonth}
        onCategoryFilter={(slugs) => setCategoryFilter(slugs)}
      />
      {Array.from(grouped.entries()).map(([monthKey, monthEvents]) => {
        const firstDate = parseISO(monthEvents[0].startAt);
        const monthLabel = format(firstDate, "MMMM yyyy");
        return (
          <div
            key={monthKey}
            ref={(el) => { monthRefs.current[monthKey] = el; }}
            style={{ animation: "cyh-fade-in 0.3s ease-out" }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 800,
                color: "var(--cyh-text, #1f2937)",
                marginBottom: "16px",
                letterSpacing: "-0.02em",
              }}
            >
              {monthLabel}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "24px",
              }}
            >
              {monthEvents.map((event, idx) => (
                <PosterCard
                  key={event.id}
                  event={event}
                  onClick={() => handleCardClick(event)}
                  style={{ animationDelay: `${idx * 50}ms` }}
                />
              ))}
            </div>
          </div>
        );
      })}
      {selectedEvent && (
        <EmbedPosterDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

interface PosterCardProps {
  event: EmbedEvent;
  onClick: () => void;
  style?: React.CSSProperties;
}

function PosterCard({ event, onClick, style }: PosterCardProps) {
  const bgColor = resolveEventColor(event);
  const textColor = getTextColor(bgColor);
  const start = parseISO(event.startAt);
  const end = event.endAt ? parseISO(event.endAt) : null;
  const timeLabel = event.allDay
    ? "All day"
    : end
      ? `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`
      : format(start, "h:mm a");
  const cats = event.categories ?? [];
  const primaryCat = cats[0];

  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        textAlign: "left",
        padding: 0,
        border: "none",
        borderRadius: "var(--cyh-radius, 12px)",
        backgroundColor: bgColor,
        color: textColor,
        cursor: "pointer",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        animation: "cyh-fade-in 0.3s ease-out both",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
      }}
    >
      {/* Date badge */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          zIndex: 1,
          width: "52px",
          padding: "6px 8px",
          borderRadius: "8px",
          backgroundColor: "rgba(255,255,255,0.95)",
          color: "#1a1a1a",
          textAlign: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.05em" }}>
          {format(start, "MMM")}
        </div>
        <div style={{ fontSize: "18px", fontWeight: 800, lineHeight: 1.1 }}>
          {format(start, "d")}
        </div>
        <div style={{ fontSize: "9px", fontWeight: 600, opacity: 0.8 }}>
          {format(start, "EEE")}
        </div>
      </div>

      {/* Card content - padding left for badge overlap */}
      <div style={{ padding: "12px 12px 16px 72px", minHeight: "80px" }}>
        {primaryCat && (
          <div
            style={{
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              opacity: 0.9,
              marginBottom: "4px",
            }}
          >
            {primaryCat.name}
          </div>
        )}
        <div
          style={{
            fontSize: "15px",
            fontWeight: 800,
            lineHeight: 1.25,
            marginBottom: event.subtitle ? "4px" : 0,
          }}
        >
          {event.title}
        </div>
        {event.subtitle && (
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              opacity: 0.9,
              marginBottom: "8px",
            }}
          >
            {event.subtitle}
          </div>
        )}
      </div>

      {/* Poster image if present */}
      {event.imageUrl && (
        <div
          style={{
            width: "100%",
            aspectRatio: "4/3",
            overflow: "hidden",
            backgroundColor: "rgba(0,0,0,0.1)",
          }}
        >
          <img
            src={event.imageUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      )}

      {/* Time and location */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          fontSize: "12px",
          fontWeight: 600,
          opacity: 0.95,
        }}
      >
        <span>• {timeLabel}</span>
        {event.venueName && <span>• {event.venueName}</span>}
      </div>

      {/* CTA button if external URL */}
      {event.externalUrl && (
        <div style={{ padding: "0 16px 16px" }}>
          <span
            style={{
              display: "inline-block",
              padding: "8px 16px",
              borderRadius: "8px",
              backgroundColor: "rgba(255,255,255,0.25)",
              fontSize: "12px",
              fontWeight: 700,
              border: "1px solid rgba(255,255,255,0.4)",
            }}
          >
            {event.externalUrlText || "Learn More"}
          </span>
        </div>
      )}
    </button>
  );
}
