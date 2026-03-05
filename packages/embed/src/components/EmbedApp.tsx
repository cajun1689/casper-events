import { useEffect, useMemo, useState } from "react";
import type { CYHCalendarConfig, EmbedEvent } from "../types";
import { createApiClient } from "../api";
import { EmbedMonthView } from "./EmbedMonthView";
import { EmbedListView } from "./EmbedListView";

type View = "month" | "list";

interface EmbedAppProps {
  config: CYHCalendarConfig;
}

export function EmbedApp({ config }: EmbedAppProps) {
  const [events, setEvents] = useState<EmbedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>(
    config.defaultView === "list" ? "list" : "month",
  );
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(),
  );

  const api = useMemo(
    () => createApiClient(config.apiUrl ?? ""),
    [config.apiUrl],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .fetchEvents(config.orgId, config.showConnectedOrgs ?? false)
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load events");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [api, config.orgId, config.showConnectedOrgs]);

  const allCategories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string | null }>();
    for (const event of events) {
      for (const cat of event.categories) {
        if (!map.has(cat.id)) {
          map.set(cat.id, { id: cat.id, name: cat.name, color: cat.color });
        }
      }
    }
    return Array.from(map.values());
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (activeCategories.size === 0) return events;
    return events.filter((e) =>
      e.categories.some((c) => activeCategories.has(c.id)),
    );
  }, [events, activeCategories]);

  const toggleCategory = (id: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const theme = config.theme ?? {};
  const rootStyle: Record<string, string> = {
    "--cyh-primary": theme.primaryColor ?? "#2563eb",
    "--cyh-bg": theme.backgroundColor ?? "#ffffff",
    "--cyh-text": theme.textColor ?? "#1f2937",
    "--cyh-accent": theme.accentColor ?? "#f59e0b",
    "--cyh-radius": theme.borderRadius ?? "8px",
    "--cyh-font": theme.fontFamily ?? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    "--cyh-border": "color-mix(in srgb, var(--cyh-text) 15%, var(--cyh-bg))",
  };

  return (
    <div
      style={{
        ...rootStyle,
        fontFamily: "var(--cyh-font)",
        color: "var(--cyh-text, #1f2937)",
        backgroundColor: "var(--cyh-bg, #ffffff)",
        borderRadius: "var(--cyh-radius, 8px)",
        border: "1px solid var(--cyh-border, #e5e7eb)",
        overflow: "hidden",
      } as React.CSSProperties}
    >
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        borderBottom: "1px solid var(--cyh-border, #e5e7eb)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}>
          <span style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--cyh-primary, #2563eb)",
            letterSpacing: "-0.01em",
          }}>
            CYH
          </span>
          <span style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "color-mix(in srgb, var(--cyh-text, #1f2937) 60%, transparent)",
          }}>
            Calendar
          </span>
        </div>

        <div style={{
          display: "flex",
          borderRadius: "var(--cyh-radius, 6px)",
          border: "1px solid var(--cyh-border, #e5e7eb)",
          overflow: "hidden",
        }}>
          <ViewToggle
            label="Month"
            active={view === "month"}
            onClick={() => setView("month")}
          />
          <ViewToggle
            label="List"
            active={view === "list"}
            onClick={() => setView("list")}
          />
        </div>
      </div>

      {/* Category filters */}
      {allCategories.length > 1 && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          padding: "10px 14px",
          borderBottom: "1px solid var(--cyh-border, #e5e7eb)",
        }}>
          {allCategories.map((cat) => {
            const isActive = activeCategories.has(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                style={{
                  padding: "3px 10px",
                  borderRadius: "9999px",
                  fontSize: "11px",
                  fontWeight: 600,
                  border: "1px solid",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  backgroundColor: isActive
                    ? (cat.color ?? "var(--cyh-primary, #2563eb)")
                    : "transparent",
                  color: isActive
                    ? "#fff"
                    : (cat.color ?? "var(--cyh-primary, #2563eb)"),
                  borderColor: cat.color ?? "var(--cyh-primary, #2563eb)",
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "14px" }}>
        {loading && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px",
          }}>
            <div style={{
              width: "24px",
              height: "24px",
              border: "2px solid var(--cyh-border, #e5e7eb)",
              borderTopColor: "var(--cyh-primary, #2563eb)",
              borderRadius: "50%",
              animation: "cyh-spin 0.8s linear infinite",
            }} />
            <style>{`@keyframes cyh-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {error && (
          <div style={{
            padding: "16px",
            textAlign: "center",
            fontSize: "13px",
            color: "#dc2626",
            backgroundColor: "#fef2f2",
            borderRadius: "var(--cyh-radius, 6px)",
          }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          view === "month"
            ? <EmbedMonthView events={filteredEvents} />
            : <EmbedListView events={filteredEvents} />
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 14px",
        borderTop: "1px solid var(--cyh-border, #e5e7eb)",
        textAlign: "center",
      }}>
        <a
          href="https://cyhcalendar.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "10px",
            color: "color-mix(in srgb, var(--cyh-text, #1f2937) 35%, transparent)",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--cyh-primary, #2563eb)"; }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color =
              "color-mix(in srgb, var(--cyh-text, #1f2937) 35%, transparent)";
          }}
        >
          Powered by CYH Calendar
        </a>
      </div>
    </div>
  );
}

function ViewToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 12px",
        fontSize: "11px",
        fontWeight: 600,
        border: "none",
        cursor: "pointer",
        backgroundColor: active
          ? "var(--cyh-primary, #2563eb)"
          : "transparent",
        color: active
          ? "#fff"
          : "color-mix(in srgb, var(--cyh-text, #1f2937) 60%, transparent)",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}
