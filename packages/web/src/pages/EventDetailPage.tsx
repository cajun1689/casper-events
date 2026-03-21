import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Clock, CalendarDays, ExternalLink, Ticket, DollarSign, Building2, ArrowLeft, Link2, Mail, Users, Share2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { safeSanitizeHtml } from "@/lib/sanitize";
import { useStore } from "@/lib/store";
import { eventsApi } from "@/lib/api";
import type { EventWithDetails } from "@cyh/shared";
import { formatRecurrenceRule } from "@cyh/shared";

function escapeICS(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
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

function generateICS(event: EventWithDetails): string {
  const start = format(parseISO(event.startAt), "yyyyMMdd") + "T" + format(parseISO(event.startAt), "HHmmss");
  const end = event.endAt ? format(parseISO(event.endAt), "yyyyMMdd") + "T" + format(parseISO(event.endAt), "HHmmss") : start;
  const location = [event.venueName, event.address].filter(Boolean).join(", ");
  const desc = event.description ? event.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 500) : "";
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

function getGoogleCalendarUrl(event: EventWithDetails): string {
  const start = parseISO(event.startAt);
  const end = event.endAt ? parseISO(event.endAt) : start;
  const location = [event.venueName, event.address].filter(Boolean).join(", ");
  const desc = event.description ? event.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 500) : "";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: event.allDay
      ? `${format(start, "yyyyMMdd")}/${format(end, "yyyyMMdd")}`
      : `${start.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z/${end.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
  });
  if (desc) params.set("details", desc);
  if (location) params.set("location", location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function getOutlookCalendarUrl(event: EventWithDetails): string {
  const start = parseISO(event.startAt);
  const end = event.endAt ? parseISO(event.endAt) : start;
  const location = [event.venueName, event.address].filter(Boolean).join(", ");
  const desc = event.description ? event.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 500) : "";
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    subject: event.title,
  });
  if (desc) params.set("body", desc);
  if (location) params.set("location", location);
  if (event.allDay) params.set("allday", "true");
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useStore();
  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvp, setRsvp] = useState<{ count: number; userRsvped: boolean } | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpEmail, setRsvpEmail] = useState("");

  useEffect(() => {
    if (!id) return;
    eventsApi.get(id).then((data) => { setEvent(data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!event) return;
    const title = `${event.title} | Casper Events`;
    document.title = title;
    const desc = event.snippet || event.subtitle || (event.description?.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 160) ?? "");
    const url = window.location.href;
    const image = event.imageUrl ?? null;
    const setMeta = (key: string, content: string, useProperty: boolean) => {
      const attr = useProperty ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("og:title", title, true);
    setMeta("og:description", desc, true);
    setMeta("og:url", url, true);
    setMeta("og:type", "website", true);
    setMeta("twitter:title", title, false);
    setMeta("twitter:description", desc, false);
    setMeta("twitter:card", image ? "summary_large_image" : "summary", false);
    if (image) setMeta("og:image", image, true);
    return () => {
      document.title = "Casper Events";
      setMeta("og:title", "Casper Events", true);
      setMeta("og:description", "Discover events, activities, and things to do in Casper, Wyoming.", true);
      setMeta("og:url", window.location.origin + "/", true);
      setMeta("twitter:title", "Casper Events", false);
      setMeta("twitter:description", "Discover events, activities, and things to do in Casper, Wyoming.", false);
      setMeta("twitter:card", "summary_large_image", false);
    };
  }, [event]);

  useEffect(() => {
    if (!id) return;
    eventsApi.getRsvp(id).then(setRsvp).catch(() => setRsvp({ count: 0, userRsvped: false }));
  }, [id]);

  async function handleRsvp() {
    if (!id) return;
    setRsvpLoading(true);
    try {
      const res = await eventsApi.rsvp(id, rsvpEmail ? { email: rsvpEmail } : undefined);
      setRsvp(res);
    } catch {
      // Error handled by API
    } finally {
      setRsvpLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="skeleton h-64 w-full mb-6 rounded-2xl" />
        <div className="skeleton h-8 w-2/3 mb-4" />
        <div className="skeleton h-4 w-1/2 mb-2" />
        <div className="skeleton h-4 w-1/3" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center animate-fade-in">
        <p className="text-4xl mb-3">🔍</p>
        <h1 className="text-xl font-extrabold text-gray-900">Event Not Found</h1>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary-600 hover:text-primary-700">← Back to calendar</Link>
      </div>
    );
  }

  const start = parseISO(event.startAt);
  const end = event.endAt ? parseISO(event.endAt) : null;
  const mapUrl = event.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}` : null;
  const timeLabel = event.allDay ? "All day" : end ? `${format(start, "h:mm a")} – ${format(end, "h:mm a")}` : format(start, "h:mm a");
  const sponsors = event.sponsors ?? [];

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in">
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back to calendar
      </Link>

      <article className="overflow-hidden rounded-3xl border border-gray-200/60 bg-white/80 shadow-xl shadow-gray-200/30 backdrop-blur-sm">
        {/* Full poster display - matches poster card style */}
        <div
          className="relative overflow-hidden"
          style={{
            ...(isGradient(resolveColor(event)) ? { background: resolveColor(event) } : { backgroundColor: resolveColor(event) }),
            color: getTextColor(resolveColor(event)),
          }}
        >
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              {/* Date badge */}
              <div className="flex w-20 shrink-0 flex-col items-center rounded-xl bg-white/95 py-3 shadow-lg">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                  {format(start, "MMM")}
                </span>
                <span className="text-2xl font-extrabold leading-tight text-gray-900">
                  {format(start, "d")}
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                  {format(start, "EEE")}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                {event.categories[0] && (
                  <span
                    className="mb-2 inline-block text-[10px] font-extrabold uppercase tracking-widest"
                    style={{ opacity: 0.9 }}
                  >
                    {event.categories[0].name}
                  </span>
                )}
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {event.title}
                </h1>
                {event.subtitle && (
                  <p className="mt-1 text-base font-semibold" style={{ opacity: 0.9 }}>
                    {event.subtitle}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold" style={{ opacity: 0.95 }}>
                  <span>• {timeLabel}</span>
                  {event.venueName && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {event.venueName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Full poster image - object-contain so entire image is visible */}
          {event.imageUrl && (
            <div className="w-full bg-black/10">
              <img
                src={event.imageUrl}
                alt={event.title}
                loading="lazy"
                className="mx-auto max-h-[480px] w-full object-contain"
              />
            </div>
          )}

          {/* Sponsor logos in poster area - grouped by level */}
          {sponsors.length > 0 && (
            <div className="border-t border-white/20 px-6 py-5">
              <p className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ opacity: 0.9 }}>
                Brought to you by
              </p>
              <SponsorGrid sponsors={sponsors} variant="poster" />
            </div>
          )}
        </div>

        <div className="p-6 sm:p-10">
          {event.categories.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {event.categories.map((cat) => (
                <span key={cat.id} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: cat.color ? `${cat.color}14` : "#4f46e514", color: cat.color ?? "#4f46e5" }}>
                  {cat.icon && <span>{cat.icon}</span>} {cat.name}
                </span>
              ))}
            </div>
          )}

          {/* External CTA - prominent button like David Street Station */}
          {event.externalUrl && (
            <div className="mb-8">
              <a
                href={event.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-800 bg-[#e8ecf0] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-gray-900 shadow-sm transition-all hover:bg-gray-100"
              >
                <ExternalLink className="h-4 w-4" />
                {event.externalUrlText || "Learn More"}
              </a>
              {event.externalUrlCaption && (
                <p className="mt-2 text-sm text-gray-500">{event.externalUrlCaption}</p>
              )}
            </div>
          )}

          {event.description && (
            <div
              className="prose prose-sm max-w-none mb-8 text-gray-600"
              dangerouslySetInnerHTML={{ __html: safeSanitizeHtml(event.description) }}
            />
          )}

          {/* WHEN / WHERE side-by-side */}
          <div className="mb-8 grid gap-8 sm:grid-cols-2">
            {/* WHEN */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-900" />
                <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-gray-900">When</p>
              </div>
              <p className="font-semibold text-gray-900">
                {format(start, "EEEE, MMMM d")} {timeLabel}
              </p>
              {event.recurrenceRule && (
                <p className="mt-1 text-sm text-gray-600">
                  Repeats: {formatRecurrenceRule(event.recurrenceRule) ?? event.recurrenceRule}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-3">
                <a
                  href={getGoogleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Google Calendar
                </a>
                <a
                  href={getOutlookCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Outlook
                </a>
                <button
                  onClick={handleAddToCalendar}
                  className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Apple Calendar / Download (.ics)
                </button>
              </div>
            </div>

            {/* WHERE */}
            {(event.venueName || event.address) && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-900" />
                  <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-gray-900">Where</p>
                </div>
                {event.venueName && (
                  <p className="font-bold uppercase tracking-wide text-gray-900">{event.venueName}</p>
                )}
                {event.address && <p className="mt-1 text-gray-600">{event.address}</p>}
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-bold uppercase tracking-wide text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    Get Directions
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Map - full width below WHEN/WHERE */}
          {event.address && (
            <div className="mb-8 overflow-hidden rounded-xl border border-gray-200">
              <iframe
                title="Event location"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(event.address)}&z=15&output=embed`}
                className="h-72 w-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}

          {event.cost && (
            <div className="mb-8 flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-gray-500" />
              <span className="font-semibold text-gray-700">{event.cost}</span>
            </div>
          )}

          {event.ticketUrl && (
            <div className="mb-8">
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-700"
              >
                <Ticket className="h-4 w-4" /> Get Tickets
              </a>
            </div>
          )}

          {/* RSVP / Interested */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3">
              {rsvp?.userRsvped ? (
                <span className="inline-flex items-center gap-2 rounded-xl border-2 border-green-200 bg-green-50 px-5 py-2.5 text-sm font-bold text-green-800">
                  <Users className="h-4 w-4" /> You&apos;re going
                </span>
              ) : (
                <>
                  {!token && (
                    <input
                      type="email"
                      placeholder="Your email"
                      value={rsvpEmail}
                      onChange={(e) => setRsvpEmail(e.target.value)}
                      className="rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-100"
                    />
                  )}
                  <button
                    onClick={handleRsvp}
                    disabled={rsvpLoading || (!token && !rsvpEmail.trim())}
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-primary-600 bg-primary-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-700 disabled:opacity-50"
                  >
                    <Users className="h-4 w-4" />
                    {rsvpLoading ? "..." : "I'm going"}
                  </button>
                </>
              )}
              {rsvp && rsvp.count > 0 && (
                <span className="text-sm font-semibold text-gray-600">
                  {rsvp.count} {rsvp.count === 1 ? "person" : "people"} interested
                </span>
              )}
            </div>
          </div>

          {/* SHARE section */}
          <div className="border-t border-gray-200 pt-8">
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.15em] text-gray-700">Share</p>
            <div className="flex flex-wrap gap-3">
              {typeof navigator !== "undefined" && navigator.share && (
                <button
                  onClick={async () => {
                    try {
                      await navigator.share({
                        title: event.title,
                        text: event.subtitle || event.title,
                        url: window.location.href,
                      });
                    } catch { /* user cancelled */ }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-5 py-2.5 text-sm font-bold text-gray-800 transition-all hover:bg-gray-100"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
              )}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-5 py-2.5 text-sm font-bold text-gray-800 transition-all hover:bg-gray-100"
              >
                Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(event.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-5 py-2.5 text-sm font-bold text-gray-800 transition-all hover:bg-gray-100"
              >
                X
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-5 py-2.5 text-sm font-bold text-gray-800 transition-all hover:bg-gray-100"
              >
                <Link2 className="h-4 w-4" /> Copy Link
              </button>
              <a
                href={`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(window.location.href)}`}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-5 py-2.5 text-sm font-bold text-gray-800 transition-all hover:bg-gray-100"
              >
                <Mail className="h-4 w-4" /> Email
              </a>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <Link to={`/organizations/${event.organization.slug}`} className="group flex items-center gap-3">
              {event.organization.logoUrl ? (
                <img src={event.organization.logoUrl} alt={event.organization.name} className="h-11 w-11 rounded-xl object-cover ring-2 ring-gray-100" />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-bold text-white shadow-md shadow-primary-500/20">{event.organization.name.charAt(0)}</span>
              )}
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{event.organization.name}</p>
                <p className="flex items-center gap-1 text-xs font-medium text-gray-400"><Building2 className="h-3 w-3" />Organized by</p>
              </div>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

const SPONSOR_LEVELS = ["presenting", "gold", "silver", "bronze", "community"] as const;

const LEVEL_CONFIG: Record<string, { maxW: string; maxH: string; textSize: string; gap: string }> = {
  presenting: { maxW: "220px", maxH: "80px", textSize: "text-base", gap: "gap-8" },
  gold:       { maxW: "160px", maxH: "60px", textSize: "text-sm",  gap: "gap-6" },
  silver:     { maxW: "120px", maxH: "48px", textSize: "text-sm",  gap: "gap-5" },
  bronze:     { maxW: "90px",  maxH: "36px", textSize: "text-xs",  gap: "gap-4" },
  community:  { maxW: "64px",  maxH: "28px", textSize: "text-xs",  gap: "gap-3" },
};

function SponsorGrid({
  sponsors,
  variant,
}: {
  sponsors: EventWithDetails["sponsors"];
  variant: "poster" | "detail";
}) {
  const grouped = SPONSOR_LEVELS
    .map((level) => ({ level, items: sponsors.filter((s) => s.level === level) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4 flex flex-col items-center">
      {grouped.map(({ level, items }) => {
        const cfg = LEVEL_CONFIG[level];
        return (
          <div key={level} className={`flex flex-wrap items-center justify-center ${cfg.gap}`}>
            {items.map((s) => {
              const content = (
                <>
                  {s.logoUrl ? (
                    <img
                      src={s.logoUrl}
                      alt={s.name}
                      className="object-contain"
                      style={{ maxWidth: cfg.maxW, maxHeight: cfg.maxH }}
                    />
                  ) : (
                    <span className={`font-bold ${cfg.textSize} ${variant === "poster" ? "" : "text-gray-800"}`}>
                      {s.name}
                    </span>
                  )}
                  <span
                    className={`font-semibold ${variant === "poster" ? "" : "text-gray-500"}`}
                    style={{ fontSize: "10px", opacity: variant === "poster" ? 0.85 : 1 }}
                  >
                    {s.name}
                  </span>
                </>
              );
              return s.websiteUrl ? (
                <a
                  key={s.id}
                  href={s.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 transition-opacity hover:opacity-80"
                >
                  {content}
                </a>
              ) : (
                <div key={s.id} className="flex flex-col items-center gap-1">
                  {content}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
