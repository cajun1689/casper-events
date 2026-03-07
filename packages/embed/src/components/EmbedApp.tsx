import { useEffect, useMemo, useState, useCallback } from "react";
import type { CYHCalendarConfig, EmbedEvent } from "../types";
import { createApiClient } from "../api";
import { EmbedMonthView } from "./EmbedMonthView";
import { EmbedListView } from "./EmbedListView";
import { EmbedPosterView } from "./EmbedPosterView";
import { printEmbedCalendar } from "../lib/print-calendar";

type View = "month" | "list" | "poster";

interface EmbedAppProps {
  config: CYHCalendarConfig;
}

export function EmbedApp({ config }: EmbedAppProps) {
  const [events, setEvents] = useState<EmbedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>(
    config.defaultView === "list" ? "list" : config.defaultView === "poster" ? "poster" : "month",
  );
  const [disabledCategories, setDisabledCategories] = useState<Set<string>>(new Set());
  const [printDate, setPrintDate] = useState(() => new Date());

  const hiddenSlugs = useMemo(
    () => new Set(config.hiddenCategories ?? []),
    [config.hiddenCategories],
  );

  const api = useMemo(() => createApiClient(config.apiUrl ?? "https://api.casperevents.org/v1"), [config.apiUrl]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.fetchEvents(config.orgId, config.showConnectedOrgs ?? false)
      .then((data) => { if (!cancelled) setEvents(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load events"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [api, config.orgId, config.showConnectedOrgs]);

  const allCategories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug: string; color: string | null }>();
    for (const event of events) {
      for (const cat of event.categories) {
        if (!hiddenSlugs.has(cat.slug) && !map.has(cat.id))
          map.set(cat.id, { id: cat.id, name: cat.name, slug: cat.slug, color: cat.color });
      }
    }
    return Array.from(map.values());
  }, [events, hiddenSlugs]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (e.categories.length === 0) return true;
      const visibleCats = e.categories.filter((c) => !hiddenSlugs.has(c.slug));
      if (visibleCats.length === 0) return false;
      if (disabledCategories.size === 0) return true;
      return visibleCats.some((c) => !disabledCategories.has(c.id));
    });
  }, [events, hiddenSlugs, disabledCategories]);

  const toggleCategory = (id: string) => {
    setDisabledCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handlePrint = useCallback(() => {
    printEmbedCalendar({
      currentDate: printDate,
      events: filteredEvents,
      primaryColor: config.theme?.primaryColor ?? "#4f46e5",
    });
  }, [printDate, filteredEvents, config.theme?.primaryColor]);

  const handleMonthChange = useCallback((date: Date) => {
    setPrintDate(date);
  }, []);

  const theme = config.theme ?? {};
  const rootStyle: Record<string, string> = {
    "--cyh-primary": theme.primaryColor ?? "#4f46e5",
    "--cyh-bg": theme.backgroundColor ?? "#ffffff",
    "--cyh-text": theme.textColor ?? "#1f2937",
    "--cyh-accent": theme.accentColor ?? "#f59e0b",
    "--cyh-radius": theme.borderRadius ?? "12px",
    "--cyh-font": theme.fontFamily ?? '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    "--cyh-border": "color-mix(in srgb, var(--cyh-text) 12%, var(--cyh-bg))",
    "--cyh-hover": "color-mix(in srgb, var(--cyh-primary) 6%, var(--cyh-bg))",
  };

  return (
    <div
      style={{
        ...rootStyle,
        fontFamily: "var(--cyh-font)",
        color: "var(--cyh-text)",
        backgroundColor: "var(--cyh-bg)",
        borderRadius: "var(--cyh-radius)",
        border: "1px solid var(--cyh-border)",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
      } as React.CSSProperties}
    >
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        borderBottom: "1px solid var(--cyh-border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: `linear-gradient(135deg, var(--cyh-primary), color-mix(in srgb, var(--cyh-primary) 80%, #000))`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            boxShadow: `0 2px 8px color-mix(in srgb, var(--cyh-primary) 30%, transparent)`,
          }}>
            📅
          </div>
          <span style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--cyh-text)",
            letterSpacing: "-0.01em",
          }}>
            Events
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={handlePrint}
            title="Print monthly calendar"
            style={{
              background: "none",
              border: "1px solid var(--cyh-border)",
              cursor: "pointer",
              padding: "5px 10px",
              borderRadius: "8px",
              color: "color-mix(in srgb, var(--cyh-text) 50%, transparent)",
              fontSize: "11px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--cyh-primary)"; e.currentTarget.style.borderColor = "var(--cyh-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "color-mix(in srgb, var(--cyh-text) 50%, transparent)"; e.currentTarget.style.borderColor = "var(--cyh-border)"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print
          </button>
          <div style={{
            display: "flex",
            borderRadius: "10px",
            border: "1px solid var(--cyh-border)",
            overflow: "hidden",
            backgroundColor: "color-mix(in srgb, var(--cyh-bg) 90%, var(--cyh-text))",
            padding: "2px",
          }}>
            <ViewToggle label="Month" active={view === "month"} onClick={() => setView("month")} />
            <ViewToggle label="List" active={view === "list"} onClick={() => setView("list")} />
            <ViewToggle label="Poster" active={view === "poster"} onClick={() => setView("poster")} />
          </div>
        </div>
      </div>

      {/* Category toggles */}
      {allCategories.length > 1 && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "5px",
          padding: "10px 16px",
          borderBottom: "1px solid var(--cyh-border)",
        }}>
          {allCategories.map((cat) => {
            const isOn = !disabledCategories.has(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: "1px solid",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backgroundColor: isOn
                    ? (cat.color ?? "var(--cyh-primary)")
                    : "transparent",
                  color: isOn
                    ? "#fff"
                    : "color-mix(in srgb, var(--cyh-text) 35%, transparent)",
                  borderColor: isOn
                    ? "transparent"
                    : "var(--cyh-border)",
                  boxShadow: isOn
                    ? `0 2px 8px ${cat.color ?? "var(--cyh-primary)"}40`
                    : "none",
                  opacity: isOn ? 1 : 0.6,
                  textDecoration: isOn ? "none" : "line-through",
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "16px" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
            <div style={{
              width: "28px",
              height: "28px",
              border: "3px solid var(--cyh-border)",
              borderTopColor: "var(--cyh-primary)",
              borderRadius: "50%",
              animation: "cyh-spin 0.8s linear infinite",
            }} />
          </div>
        )}

        {error && (
          <div style={{
            padding: "16px",
            textAlign: "center",
            fontSize: "13px",
            fontWeight: 600,
            color: "#dc2626",
            backgroundColor: "#fef2f2",
            borderRadius: "var(--cyh-radius)",
          }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{ animation: "cyh-fade-in 0.3s ease-out" }}>
            {view === "month" ? (
              <EmbedMonthView events={filteredEvents} onMonthChange={handleMonthChange} />
            ) : view === "poster" ? (
              <EmbedPosterView events={filteredEvents} categories={allCategories} ctaOpensExternal={config.ctaOpensExternal} />
            ) : (
              <EmbedListView events={filteredEvents} />
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "10px 16px",
        borderTop: "1px solid var(--cyh-border)",
        textAlign: "center",
      }}>
        <a
          href="https://casperevents.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "color-mix(in srgb, var(--cyh-text) 30%, transparent)",
            textDecoration: "none",
            letterSpacing: "0.02em",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--cyh-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "color-mix(in srgb, var(--cyh-text) 30%, transparent)"; }}
        >
          Powered by Casper Events
        </a>
      </div>
    </div>
  );
}

function ViewToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 14px",
        fontSize: "11px",
        fontWeight: 700,
        border: "none",
        borderRadius: "8px",
        transition: "all 0.2s ease",
        backgroundColor: active ? "var(--cyh-primary)" : "transparent",
        color: active ? "#fff" : "color-mix(in srgb, var(--cyh-text) 50%, transparent)",
        boxShadow: active ? `0 2px 6px color-mix(in srgb, var(--cyh-primary) 30%, transparent)` : "none",
      }}
    >
      {label}
    </button>
  );
}
