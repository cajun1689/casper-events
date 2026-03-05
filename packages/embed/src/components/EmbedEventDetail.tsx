import { format, parseISO } from "date-fns";
import type { EmbedEvent } from "../types";

interface EmbedEventDetailProps {
  event: EmbedEvent;
}

export function EmbedEventDetail({ event }: EmbedEventDetailProps) {
  const start = parseISO(event.startAt);
  const end = event.endAt ? parseISO(event.endAt) : null;

  const timeLabel = event.allDay
    ? "All day"
    : end
      ? `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`
      : format(start, "h:mm a");

  const dateLabel = format(start, "EEEE, MMMM d, yyyy");

  return (
    <div style={{
      padding: "14px",
      borderRadius: "var(--cyh-radius, 6px)",
      border: "1px solid var(--cyh-border, #e5e7eb)",
      backgroundColor: "var(--cyh-bg, #ffffff)",
    }}>
      <div style={{
        fontSize: "15px",
        fontWeight: 700,
        color: "var(--cyh-text, #1f2937)",
        lineHeight: 1.3,
        marginBottom: "8px",
      }}>
        {event.title}
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        marginBottom: event.description || event.categories.length > 0 ? "12px" : 0,
      }}>
        <DetailRow icon="📅" text={dateLabel} />
        <DetailRow icon="🕐" text={timeLabel} />
        {event.venueName && <DetailRow icon="📍" text={event.venueName} />}
        {event.address && (
          <DetailRow
            icon="🗺"
            text={event.address}
            href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`}
          />
        )}
        {event.cost && <DetailRow icon="💰" text={event.cost} />}
      </div>

      {event.categories.length > 0 && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          marginBottom: event.description ? "12px" : 0,
        }}>
          {event.categories.map((cat) => (
            <span
              key={cat.id}
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: "9999px",
                fontSize: "11px",
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

      {event.description && (
        <div style={{
          fontSize: "13px",
          lineHeight: 1.6,
          color: "color-mix(in srgb, var(--cyh-text, #1f2937) 75%, transparent)",
          whiteSpace: "pre-line",
        }}>
          {event.description}
        </div>
      )}

      {event.ticketUrl && (
        <a
          href={event.ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "12px",
            padding: "8px 16px",
            borderRadius: "var(--cyh-radius, 6px)",
            backgroundColor: "var(--cyh-primary, #2563eb)",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          🎟 Get Tickets
        </a>
      )}
    </div>
  );
}

function DetailRow({
  icon,
  text,
  href,
}: {
  icon: string;
  text: string;
  href?: string;
}) {
  const content = (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "8px",
      fontSize: "12px",
      color: "color-mix(in srgb, var(--cyh-text, #1f2937) 70%, transparent)",
      lineHeight: 1.4,
    }}>
      <span style={{ flexShrink: 0, fontSize: "13px" }}>{icon}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--cyh-primary, #2563eb)",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
        >
          {text}
        </a>
      ) : (
        <span>{text}</span>
      )}
    </div>
  );
  return content;
}
