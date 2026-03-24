import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import type { EmbedEvent } from "../types";

/** Format yyyy-MM key into a display label using a local-time date (avoids UTC midnight shift). */
function monthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return format(new Date(y, m - 1, 1), "MMMM yyyy");
}

interface EmbedPosterFiltersProps {
  events: EmbedEvent[];
  categories: { id: string; name: string; slug: string; color: string | null }[];
  onMonthSelect?: (monthKey: string) => void;
  onCategoryFilter?: (slugs: string[]) => void;
}


export function EmbedPosterFilters({
  events,
  categories,
  onMonthSelect,
  onCategoryFilter,
}: EmbedPosterFiltersProps) {
  const [datesOpen, setDatesOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  const months = React.useMemo(() => {
    const set = new Set<string>();
    for (const e of events) {
      set.add(format(parseISO(e.startAt), "yyyy-MM"));
    }
    return Array.from(set).sort();
  }, [events]);

  const handleMonthClick = (monthKey: string) => {
    setSelectedMonth(monthKey);
    setDatesOpen(false);
    onMonthSelect?.(monthKey);
  };

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      onCategoryFilter?.(Array.from(next));
      return next;
    });
  };

  const applyCategories = () => {
    setTypeOpen(false);
    onCategoryFilter?.(Array.from(selectedCategories));
  };

  if (months.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginBottom: "8px",
      }}
    >
      {/* Dates dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => { setDatesOpen(!datesOpen); setTypeOpen(false); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "var(--cyh-radius, 10px)",
            border: "1px solid var(--cyh-border, #e5e7eb)",
            backgroundColor: "var(--cyh-bg, #ffffff)",
            color: "var(--cyh-text, #1f2937)",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {selectedMonth ? monthLabel(selectedMonth) : "Dates"}
          <span style={{ fontSize: "10px" }}>▼</span>
        </button>
        {datesOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: "4px",
              minWidth: "160px",
              padding: "8px",
              borderRadius: "var(--cyh-radius, 10px)",
              border: "1px solid var(--cyh-border, #e5e7eb)",
              backgroundColor: "var(--cyh-bg, #ffffff)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 10,
            }}
          >
            <button
              onClick={() => { setSelectedMonth(null); setDatesOpen(false); onMonthSelect?.(""); }}
              style={{
                display: "block",
                width: "100%",
                padding: "6px 10px",
                textAlign: "left",
                border: "none",
                borderRadius: "6px",
                backgroundColor: "transparent",
                color: "var(--cyh-text, #1f2937)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              All Upcoming
            </button>
            {months.map((m) => (
              <button
                key={m}
                onClick={() => handleMonthClick(m)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "6px 10px",
                  textAlign: "left",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: selectedMonth === m ? "color-mix(in srgb, var(--cyh-primary) 10%, transparent)" : "transparent",
                  color: "var(--cyh-text, #1f2937)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {monthLabel(m)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Event Type dropdown */}
      {categories.length > 0 && (
        <div style={{ position: "relative" }}>
          <button
            onClick={() => { setTypeOpen(!typeOpen); setDatesOpen(false); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "var(--cyh-radius, 10px)",
              border: "1px solid var(--cyh-border, #e5e7eb)",
              backgroundColor: "var(--cyh-bg, #ffffff)",
              color: "var(--cyh-text, #1f2937)",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Event Type {selectedCategories.size > 0 && `(${selectedCategories.size})`}
            <span style={{ fontSize: "10px" }}>▼</span>
          </button>
          {typeOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: "4px",
                minWidth: "200px",
                padding: "12px",
                borderRadius: "var(--cyh-radius, 10px)",
                border: "1px solid var(--cyh-border, #e5e7eb)",
                backgroundColor: "var(--cyh-bg, #ffffff)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                zIndex: 10,
              }}
            >
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 0",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.has(cat.slug)}
                    onChange={() => toggleCategory(cat.slug)}
                  />
                  {cat.name}
                </label>
              ))}
              <button
                onClick={applyCategories}
                style={{
                  marginTop: "8px",
                  width: "100%",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "var(--cyh-primary, #4f46e5)",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
