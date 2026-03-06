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
      padding: "16px",
      borderRadius: "var(--cyh-radius, 10px)",
      border: "1px solid var(--cyh-border, #e5e7eb)",
      backgroundColor: "var(--cyh-bg, #ffffff)",
      boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
    }}>
      <div style={{
        fontSize: "15px",
        fontWeight: 800,
        color: "var(--cyh-text, #1f2937)",
        lineHeight: 1.3,
        marginBottom: "10px",
        letterSpacing: "-0.01em",
      }}>
        {event.title}
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "7px",
        marginBottom: event.description || event.categories.length > 0 ? "14px" : 0,
      }}>
        <DetailRow icon="📅" text={dateLabel} />
        <DetailRow icon="🕐" text={timeLabel} />
        {event.venueName && <DetailRow icon="📍" text={event.venueName} />}
        {event.address && (
          <DetailRow icon="🗺" text={event.address} href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`} />
        )}
        {event.cost && <DetailRow icon="💰" text={event.cost} />}
        {event.organization && <DetailRow icon="🏢" text={event.organization.name} />}
      </div>

      {event.categories.length > 0 && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          marginBottom: event.description ? "14px" : 0,
        }}>
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

      {event.description && (
        <div style={{
          fontSize: "13px",
          lineHeight: 1.65,
          color: "color-mix(in srgb, var(--cyh-text, #1f2937) 70%, transparent)",
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
            marginTop: "14px",
            padding: "9px 18px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, var(--cyh-primary, #4f46e5), color-mix(in srgb, var(--cyh-primary) 80%, #000))",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 700,
            textDecoration: "none",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 8px color-mix(in srgb, var(--cyh-primary) 30%, transparent)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px color-mix(in srgb, var(--cyh-primary) 35%, transparent)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px color-mix(in srgb, var(--cyh-primary) 30%, transparent)"; }}
        >
          🎟 Get Tickets
        </a>
      )}
    </div>
  );
}

function DetailRow({ icon, text, href }: { icon: string; text: string; href?: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "8px",
      fontSize: "12px",
      fontWeight: 500,
      color: "color-mix(in srgb, var(--cyh-text, #1f2937) 65%, transparent)",
      lineHeight: 1.4,
    }}>
      <span style={{ flexShrink: 0, fontSize: "13px" }}>{icon}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--cyh-primary, #4f46e5)", textDecoration: "none", fontWeight: 600 }}
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
}
