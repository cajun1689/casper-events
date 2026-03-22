import { useState, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { MapPin, ExternalLink } from "lucide-react";
import type { EventWithDetails } from "@cyh/shared";

interface PosterViewProps {
  events: EventWithDetails[];
}

function parseColor(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  return {
    r: parseInt(m[1].slice(0, 2), 16),
    g: parseInt(m[1].slice(2, 4), 16),
    b: parseInt(m[1].slice(4, 6), 16),
  };
}

function getTextColor(bg: string): string {
  const solid = isGradient(bg) ? getSolidFromGradient(bg) : bg;
  const c = parseColor(solid);
  if (!c) return "#1a1a1a";
  const lum = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  return lum > 0.55 ? "#1a1a1a" : "#ffffff";
}

function resolveColor(event: EventWithDetails): string {
  if (event.color) return event.color;
  const cats = event.orgCategories?.length ? event.orgCategories : event.categories ?? [];
  if (cats.length > 0 && cats[0].color) return cats[0].color;
  return "#4f46e5";
}

function isGradient(value: string): boolean {
  return typeof value === "string" && value.trim().startsWith("linear-gradient");
}

function getSolidFromGradient(value: string): string {
  const match = value?.match(/#[0-9a-fA-F]{3,6}/);
  return match ? match[0] : "#4f46e5";
}

function cleanDescription(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/_{2,}/g, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function PosterView({ events }: PosterViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const monthRefs = useRef<Record<string, HTMLElement | null>>({});

  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [events],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, EventWithDetails[]>();
    for (const event of sorted) {
      const key = event.startAt.slice(0, 7);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [sorted]);

  const now = new Date();
  const currentMonthKey = format(now, "yyyy-MM");

  const sortedEntries = useMemo(() => {
    const entries = Array.from(grouped.entries());
    return entries
      .filter(([monthKey]) => monthKey >= currentMonthKey)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [grouped, currentMonthKey]);

  const months = useMemo(() => sortedEntries.map(([k]) => k), [sortedEntries]);

  const scrollToMonth = useCallback((key: string) => {
    setSelectedMonth(key);
    monthRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200/60 bg-white/70 py-20 text-center shadow-sm backdrop-blur-sm">
        <div className="mb-3 text-4xl">📭</div>
        <p className="text-lg font-bold text-gray-400">No events found</p>
        <p className="mt-1 text-sm text-gray-400">Try adjusting your filters or date range.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Month jump */}
      {months.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {months.map((m) => (
            <button
              key={m}
              onClick={() => scrollToMonth(m)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                selectedMonth === m
                  ? "bg-primary-600 text-white shadow-md shadow-primary-500/25"
                  : "border border-gray-200/80 bg-white/60 text-gray-600 hover:bg-white hover:shadow"
              }`}
            >
              {format(new Date(m + "-01"), "MMM yyyy")}
            </button>
          ))}
        </div>
      )}

      {/* Month groups - sorted chronologically so events appear under their heading */}
      {sortedEntries.map(([monthKey, monthEvents]) => (
        <section
          key={monthKey}
          ref={(el) => { monthRefs.current[monthKey] = el; }}
          className="animate-fade-in"
        >
          <h2 className="mb-5 text-lg font-extrabold tracking-tight text-gray-900">
            {format(new Date(monthKey + "-01"), "MMMM yyyy")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {monthEvents.map((event) => (
              <PosterCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function PosterCard({ event }: { event: EventWithDetails }) {
  const bgColor = resolvePosterEventColor(event);
  const textColor = getTextColorForPosterBackground(bgColor);
  const start = parseISO(event.startAt);
  const end = event.endAt ? parseISO(event.endAt) : null;
  const timeLabel = event.allDay
    ? "All day"
    : end
      ? `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`
      : format(start, "h:mm a");
  const primaryCat = event.categories?.[0];
  const sponsors = event.sponsors ?? [];

  return (
    <Link
      to={`/events/${event.id}`}
      className="group relative flex min-h-[180px] flex-col overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      style={{
        ...(isPosterGradient(bgColor) ? { background: bgColor } : { backgroundColor: bgColor }),
        color: textColor,
      }}
    >
      {/* Date badge */}
      <div className="absolute left-3 top-3 z-10 flex w-14 flex-col items-center rounded-xl bg-white/95 py-1.5 shadow-lg">
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500">
          {format(start, "MMM")}
        </span>
        <span className="text-xl font-extrabold leading-tight text-gray-900">
          {format(start, "d")}
        </span>
        <span className="text-[9px] font-bold text-gray-400">
          {format(start, "EEE")}
        </span>
      </div>

      {/* Content area */}
      <div className="min-h-[72px] pl-20 pr-4 pt-4 pb-2">
        {primaryCat && (
          <span
            className="mb-1 inline-block text-[9px] font-extrabold uppercase tracking-widest"
            style={{ opacity: 0.85 }}
          >
            {primaryCat.name}
          </span>
        )}
        <h3 className="text-base font-extrabold leading-snug">
          {event.title}
        </h3>
        {event.subtitle && (
          <p className="mt-0.5 line-clamp-2 text-xs font-semibold" style={{ opacity: 0.9 }}>
            {event.subtitle}
          </p>
        )}
        {(event.snippet || event.description) && (
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed" style={{ opacity: 0.75 }}>
            {event.snippet || cleanDescription(event.description ?? "")}
          </p>
        )}
      </div>

      {/* Poster image - gradient overlay for glossy look */}
      {event.imageUrl && (
        <div className="relative mt-1 aspect-[4/3] w-full overflow-hidden">
          <img
            src={event.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 45%, rgba(0,0,0,0.06) 100%)",
            }}
          />
        </div>
      )}

      {/* Sponsor logos - clickable, level-sized, centered */}
      {sponsors.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-2" style={{ opacity: 0.9 }}>
          {sponsors.slice(0, 4).map((s) => {
            const h = s.level === "presenting" ? "h-8" : s.level === "gold" ? "h-7" : s.level === "silver" ? "h-6" : s.level === "bronze" ? "h-5" : "h-5";
            const mw = s.level === "presenting" ? "max-w-[80px]" : s.level === "gold" ? "max-w-[70px]" : s.level === "silver" ? "max-w-[55px]" : s.level === "bronze" ? "max-w-[48px]" : "max-w-[45px]";
            const wrapperCls = "flex items-center justify-center rounded-lg p-1.5 shadow-sm transition-opacity hover:opacity-100";
            const wrapperStyle = {
              background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 40%, rgba(0,0,0,0.08) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 3px rgba(0,0,0,0.1)",
            };
            const content = s.logoUrl ? (
              <img src={s.logoUrl} alt={s.name} loading="lazy" className={`${h} ${mw} object-contain`} title={s.name} />
            ) : (
              <span className="text-[10px] font-bold" style={{ opacity: 0.85 }}>{s.name}</span>
            );
            return s.websiteUrl ? (
              <a
                key={s.id}
                href={s.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`${wrapperCls} cursor-pointer sponsor-pulse-hover`}
                style={wrapperStyle}
              >
                {content}
              </a>
            ) : (
              <div key={s.id} className={wrapperCls} style={wrapperStyle}>
                {content}
              </div>
            );
          })}
        </div>
      )}

      {/* Time and location */}
      <div className="mt-auto flex flex-col gap-1 pl-20 pr-4 py-3 text-xs font-semibold" style={{ opacity: 0.95 }}>
        <span>• {timeLabel}</span>
        {(event.venueName || event.address) && (
          <span className="flex items-start gap-1">
            <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
            <span className="line-clamp-2">
              {event.venueName}
              {event.venueName && event.address && <span style={{ opacity: 0.7 }}> · </span>}
              {event.address && <span style={{ opacity: 0.8 }}>{event.address}</span>}
            </span>
          </span>
        )}
        {event.cost && (
          <span style={{ opacity: 0.8 }}>• {event.cost}</span>
        )}
      </div>

      {/* CTA - button opens external link; rest of card goes to event page */}
      {event.externalUrl && (
        <div className="flex flex-col items-center px-4 pb-4" onClick={(e) => e.stopPropagation()}>
          <a
            href={event.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-white/60 bg-white/90 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-900 shadow-sm transition-all hover:bg-white hover:shadow"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {event.externalUrlText || "Learn More"}
          </a>
          {event.externalUrlCaption && (
            <span className="mt-1 block text-center text-[10px] font-semibold" style={{ opacity: 0.9 }}>
              {event.externalUrlCaption}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
