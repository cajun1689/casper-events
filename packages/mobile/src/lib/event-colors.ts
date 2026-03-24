import type { EventWithDetails } from "@cyh/shared";

export function parseColor(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim();
  const m6 = h.match(/^#?([0-9a-f]{6})$/i);
  if (m6) {
    const s = m6[1];
    return {
      r: parseInt(s.slice(0, 2), 16),
      g: parseInt(s.slice(2, 4), 16),
      b: parseInt(s.slice(4, 6), 16),
    };
  }
  const m3 = h.match(/^#?([0-9a-f]{3})$/i);
  if (m3) {
    const s = m3[1];
    return {
      r: parseInt(s[0] + s[0], 16),
      g: parseInt(s[1] + s[1], 16),
      b: parseInt(s[2] + s[2], 16),
    };
  }
  return null;
}

export function isGradient(value: string): boolean {
  return typeof value === "string" && value.trim().startsWith("linear-gradient");
}

export function getSolidFromGradient(value: string): string {
  const match = value?.match(/#[0-9a-fA-F]{3,6}/);
  return match ? match[0] : "#4f46e5";
}

export function extractGradientColors(value: string): string[] {
  const matches = value.match(/#[0-9a-fA-F]{3,8}/g);
  if (matches && matches.length >= 2) return matches.slice(0, 2);
  if (matches && matches.length === 1) return [matches[0], matches[0]];
  return ["#4f46e5", "#7c3aed"];
}

/**
 * Resolve the display color for an event, matching the web logic exactly:
 * 1. event.color (custom per-event color)
 * 2. orgCategories[0].color (org-specific sub-category)
 * 3. categories[0].color (platform category)
 * 4. fallback indigo
 */
export function resolveColor(event: EventWithDetails): string {
  if (event.color) return event.color;
  const cats =
    (event as any).orgCategories?.length
      ? (event as any).orgCategories
      : event.categories ?? [];
  if (cats.length > 0 && cats[0].color) return cats[0].color;
  return "#4f46e5";
}

/** Get the solid color, extracting from gradient if needed. */
export function resolveSolidColor(event: EventWithDetails): string {
  const raw = resolveColor(event);
  return isGradient(raw) ? getSolidFromGradient(raw) : raw;
}

/** Pick white or dark text based on background luminance. */
export function getTextColor(bg: string): string {
  const solid = isGradient(bg) ? getSolidFromGradient(bg) : bg;
  const c = parseColor(solid);
  if (!c) return "#1a1a1a";
  const lum = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  return lum > 0.55 ? "#1a1a1a" : "#ffffff";
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
