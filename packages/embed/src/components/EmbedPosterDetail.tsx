import React, { useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";
import type { EmbedEvent } from "../types";

interface EmbedPosterDetailProps {
  event: EmbedEvent;
  onClose: () => void;
}

function escapeICS(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function formatICSDate(iso: string): string {
  const d = new Date(iso);
  return format(d, "yyyyMMdd") + "T" + format(d, "HHmmss");
}

function generateICS(event: EmbedEvent): string {
  const start = formatICSDate(event.startAt);
  const end = event.endAt ? formatICSDate(event.endAt) : start;
  const location = [event.venueName, event.address].filter(Boolean).join(", ");
  const desc = event.description
    ? event.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 500)
    : "";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CYH Calendar//EN",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICS(event.title)}`,
    desc ? `DESCRIPTION:${escapeICS(desc)}` : "",
    location ? `LOCATION:${escapeICS(location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function EmbedPosterDetail({ event, onClose }: EmbedPosterDetailProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const start = parseISO(event.startAt);
  const end = event.endAt ? parseISO(event.endAt) : null;
  const timeLabel = event.allDay
    ? "All day"
    : end
      ? `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`
      : format(start, "h:mm a");
  const dateLabel = format(start, "EEEE, MMMM d, yyyy");
  const sponsors = event.sponsors ?? [];
  const cats = event.categories ?? [];

  const handleAddToCalendar = () => {
    const ics = generateICS(event);
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/[^a-z0-9]/gi, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backgroundColor: "rgba(0,0,0,0.4)",
        animation: "cyh-overlay-in 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "640px",
          maxHeight: "90vh",
          overflow: "auto",
          backgroundColor: "var(--cyh-bg, #ffffff)",
          borderRadius: "var(--cyh-radius, 12px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          animation: "cyh-modal-in 0.25s ease-out",
        }}
      >
        <div style={{ position: "sticky", top: 0, backgroundColor: "var(--cyh-bg)", zIndex: 1, padding: "16px", borderBottom: "1px solid var(--cyh-border)", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              border: "1px solid var(--cyh-border)",
              backgroundColor: "transparent",
              cursor: "pointer",
              fontSize: "18px",
              color: "var(--cyh-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "0 20px 24px" }}>
          {cats[0] && (
            <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--cyh-primary)", marginBottom: "4px" }}>
              {cats[0].name}
            </div>
          )}
          <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "16px", color: "var(--cyh-text)" }}>
            {event.title}
          </h2>

          {event.externalUrl && (
            <div style={{ marginBottom: "16px" }}>
              <a
                href={event.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  backgroundColor: "var(--cyh-primary, #4f46e5)",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                {event.externalUrlText || "Learn More"}
              </a>
              {event.externalUrlCaption && (
                <div style={{ fontSize: "12px", color: "color-mix(in srgb, var(--cyh-text) 60%, transparent)", marginTop: "4px" }}>
                  {event.externalUrlCaption}
                </div>
              )}
            </div>
          )}

          {event.imageUrl && (
            <div style={{ marginBottom: "16px", borderRadius: "var(--cyh-radius)", overflow: "hidden" }}>
              <img src={event.imageUrl} alt="" style={{ width: "100%", display: "block" }} />
            </div>
          )}

          {event.description && (
            <div
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "color-mix(in srgb, var(--cyh-text) 85%, transparent)",
                marginBottom: "20px",
              }}
              dangerouslySetInnerHTML={{
                __html: event.description.startsWith("<") ? event.description : event.description.replace(/\n/g, "<br/>"),
              }}
            />
          )}

          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em", marginBottom: "8px", color: "var(--cyh-text)" }}>WHEN</div>
            <div style={{ fontSize: "14px", fontWeight: 600 }}>{dateLabel} {timeLabel}</div>
            <button
              onClick={handleAddToCalendar}
              style={{
                marginTop: "6px",
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid var(--cyh-border)",
                backgroundColor: "transparent",
                color: "var(--cyh-primary)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Add to Calendar
            </button>
          </div>

          {(event.venueName || event.address) && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em", marginBottom: "8px", color: "var(--cyh-text)" }}>WHERE</div>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>{event.venueName}</div>
              {event.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--cyh-primary)",
                    textDecoration: "none",
                  }}
                >
                  Get Directions
                </a>
              )}
            </div>
          )}

          {sponsors.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em", marginBottom: "12px", color: "var(--cyh-text)" }}>
                SPONSORED BY
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
                {sponsors.map((s, i) => (
                  <a
                    key={i}
                    href={s.websiteUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      textDecoration: "none",
                      color: "var(--cyh-text)",
                    }}
                  >
                    {s.logoUrl ? (
                      <img
                        src={s.logoUrl}
                        alt={s.name}
                        style={{
                          maxWidth: s.level === "presenting" ? "180px" : s.level === "gold" ? "130px" : s.level === "silver" ? "100px" : s.level === "bronze" ? "75px" : "55px",
                          maxHeight: "60px",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "14px", fontWeight: 700 }}>{s.name}</span>
                    )}
                    <span style={{ fontSize: "11px", fontWeight: 600, opacity: 0.8 }}>{s.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div>
            <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em", marginBottom: "8px", color: "var(--cyh-text)" }}>SHARE</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleCopyLink}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--cyh-border)",
                  backgroundColor: "transparent",
                  color: "var(--cyh-text)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Copy Link
              </button>
              <a
                href={`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(window.location.href)}`}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--cyh-border)",
                  backgroundColor: "transparent",
                  color: "var(--cyh-text)",
                  fontSize: "12px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Invite via Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
