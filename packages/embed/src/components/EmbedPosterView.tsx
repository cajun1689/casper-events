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
  /** When true, poster CTA opens external URL. Default: false (click opens event detail) */
  ctaOpensExternal?: boolean;
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
  ctaOpensExternal = false,
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
                  ctaOpensExternal={ctaOpensExternal}
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
  ctaOpensExternal?: boolean;
  style?: React.CSSProperties;
}

function PosterCard({ event, onClick, ctaOpensExternal = false, style }: PosterCardProps) {
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
        minHeight: "180px",
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

      {/* Card content - padding left clears the badge */}
      <div style={{ padding: "12px 12px 8px 72px", minHeight: "72px" }}>
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
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
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

      {/* Sponsor logos - compact row, sized by level */}
      {(event.sponsors ?? []).length > 0 && (
        <div
          style={{
            padding: "8px 16px 8px 72px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "10px",
            opacity: 0.9,
          }}
        >
          {(event.sponsors ?? []).slice(0, 4).map((s: { id?: string; name: string; logoUrl: string | null; level?: string }) => {
            const mh = s.level === "presenting" ? "32px" : s.level === "gold" ? "28px" : s.level === "silver" ? "24px" : "20px";
            const mw = s.level === "presenting" ? "80px" : s.level === "gold" ? "70px" : s.level === "silver" ? "55px" : "45px";
            return s.logoUrl ? (
              <img
                key={s.id ?? s.name}
                src={s.logoUrl}
                alt={s.name}
                title={s.name}
                style={{ maxHeight: mh, maxWidth: mw, objectFit: "contain" }}
              />
            ) : (
              <span key={s.id ?? s.name} style={{ fontSize: "10px", fontWeight: 700, opacity: 0.85 }}>
                {s.name}
              </span>
            );
          })}
        </div>
      )}

      {/* Time and location - padding left clears the badge */}
      <div
        style={{
          padding: "12px 16px 12px 72px",
          marginTop: "auto",
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

      {/* CTA - default: click opens event detail. When ctaOpensExternal: opens external URL */}
      {event.externalUrl && (
        <div style={{ padding: "0 16px 16px 72px" }}>
          {ctaOpensExternal ? (
            <a
              href={event.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "12px",
                backgroundColor: "rgba(255,255,255,0.9)",
                border: "2px solid rgba(255,255,255,0.6)",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#1a1a1a",
                textDecoration: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              {event.externalUrlText || "Learn More"}
            </a>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "12px",
                backgroundColor: "rgba(255,255,255,0.9)",
                border: "2px solid rgba(255,255,255,0.6)",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#1a1a1a",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              {event.externalUrlText || "Learn More"}
            </span>
          )}
          {event.externalUrlCaption && (
            <span style={{ display: "block", marginTop: "4px", fontSize: "10px", fontWeight: 600, opacity: 0.9 }}>
              {event.externalUrlCaption}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
