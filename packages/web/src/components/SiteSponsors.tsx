import { useState, useEffect } from "react";
import { siteSponsorsApi, type SiteSponsor } from "@/lib/api";

const SPONSOR_LEVELS = ["presenting", "gold", "silver", "bronze", "community"] as const;

const LEVEL_CONFIG: Record<string, { maxW: string; maxH: string; textSize: string; gap: string }> = {
  presenting: { maxW: "220px", maxH: "80px", textSize: "text-base", gap: "gap-8" },
  gold: { maxW: "160px", maxH: "60px", textSize: "text-sm", gap: "gap-6" },
  silver: { maxW: "120px", maxH: "48px", textSize: "text-sm", gap: "gap-5" },
  bronze: { maxW: "90px", maxH: "36px", textSize: "text-xs", gap: "gap-4" },
  community: { maxW: "64px", maxH: "28px", textSize: "text-xs", gap: "gap-3" },
};

export function SiteSponsors() {
  const [sponsors, setSponsors] = useState<SiteSponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    siteSponsorsApi
      .list()
      .then((r) => setSponsors(r.data))
      .catch(() => setSponsors([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || sponsors.length === 0) return null;

  const grouped = SPONSOR_LEVELS.map((level) => ({
    level,
    items: sponsors
      .filter((s) => s.level === level)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  })).filter((g) => g.items.length > 0);

  if (grouped.length === 0) return null;

  return (
    <section className="mt-12 rounded-2xl border border-gray-200/60 bg-white/80 px-6 py-8 shadow-sm backdrop-blur-sm">
      <h2 className="mb-6 text-center text-sm font-bold uppercase tracking-wider text-gray-500">
        Our Sponsors
      </h2>
      <div className="flex flex-col items-center gap-6">
        {grouped.map(({ level, items }) => {
          const cfg = LEVEL_CONFIG[level];
          return (
            <div
              key={level}
              className={`flex flex-wrap items-center justify-center ${cfg.gap}`}
            >
              {items.map((s, i) => {
                const content = s.logoUrl ? (
                  <img
                    src={s.logoUrl}
                    alt={s.name}
                    className="object-contain transition-opacity hover:opacity-90"
                    style={{ maxWidth: cfg.maxW, maxHeight: cfg.maxH }}
                  />
                ) : (
                  <span className={`font-bold ${cfg.textSize} text-gray-800`}>
                    {s.name}
                  </span>
                );
                return s.url ? (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center"
                  >
                    {content}
                  </a>
                ) : (
                  <div key={i} className="flex items-center justify-center">
                    {content}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
