import type { EventWithDetails } from "./types.js";

/**
 * Poster / event-card text contrast helpers.
 *
 * Gradients often list a dark brand color first and a light color second (or vice versa).
 * Using only the *first* hex for luminance picks white vs black text incorrectly and can
 * produce white text on a light band — especially near the header. We take the maximum
 * luminance across all parsed stops so that if any stop is light, we prefer dark text.
 */

/** Web, mobile, embed: event.color → org category → platform category → brand indigo */
export function resolvePosterEventColor(event: EventWithDetails): string {
  if (event.color) return event.color;
  const cats = event.orgCategories?.length ? event.orgCategories : (event.categories ?? []);
  if (cats.length > 0 && cats[0].color) return cats[0].color;
  return "#4f46e5";
}

/** Parse #RGB or #RRGGBB (optional leading #). */
export function parsePosterHex(hex: string): { r: number; g: number; b: number } | null {
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

function parseRgbColor(s: string): { r: number; g: number; b: number } | null {
  const rgb = s.trim().match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!rgb) return null;
  return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
}

export function posterLuminance(rgb: { r: number; g: number; b: number }): number {
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
}

export function isPosterGradient(value: string): boolean {
  return typeof value === "string" && value.trim().startsWith("linear-gradient");
}

/** Normalize any parsed hex to #rrggbb for React Native / CSS. */
export function posterHexToRgbString(hex: string): string {
  const c = parsePosterHex(hex.length === 9 ? hex.slice(0, 7) : hex);
  if (!c) return "#4f46e5";
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

/**
 * Two color stops for LinearGradient (matches web CSS linear-gradient hex pairs).
 * Defaults to brand indigo → purple when no hex is found.
 */
export function extractPosterGradientColors(value: string): [string, string] {
  const matches = value.match(/#[0-9a-fA-F]{3,8}/g);
  if (!matches || matches.length === 0) return ["#4f46e5", "#7c3aed"];
  const norm = (h: string) => posterHexToRgbString(h.length === 9 ? h.slice(0, 7) : h);
  if (matches.length >= 2) return [norm(matches[0]), norm(matches[1])];
  const one = norm(matches[0]);
  return [one, one];
}

/** First hex in a gradient (fallback when no stops parse). */
export function getFirstHexInGradient(value: string): string {
  const match = value?.match(/#[0-9a-fA-F]{3,8}/);
  if (!match) return "#4f46e5";
  const h = match[0];
  return posterHexToRgbString(h.length === 9 ? h.slice(0, 7) : h);
}

function hexStopsFromGradient(value: string): string[] {
  const matches = value.match(/#[0-9a-fA-F]{3,8}/g) ?? [];
  return matches.map((h) => (h.length === 9 ? h.slice(0, 7) : h));
}

function rgbStopsFromGradient(value: string): { r: number; g: number; b: number }[] {
  const out: { r: number; g: number; b: number }[] = [];
  const re = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    out.push({ r: +m[1], g: +m[2], b: +m[3] });
  }
  return out;
}

function collectRgbFromGradient(value: string): { r: number; g: number; b: number }[] {
  const rgbs: { r: number; g: number; b: number }[] = [];
  for (const c of rgbStopsFromGradient(value)) {
    rgbs.push(c);
  }
  for (const hex of hexStopsFromGradient(value)) {
    const c = parsePosterHex(hex);
    if (c) rgbs.push(c);
  }
  return rgbs;
}

/**
 * #1a1a1a on light backgrounds, #ffffff on dark — for a solid color or CSS gradient string.
 */
export function getTextColorForPosterBackground(bg: string): string {
  const s = bg.trim();
  if (isPosterGradient(s)) {
    const stops = collectRgbFromGradient(s);
    if (stops.length === 0) {
      const fallback = getFirstHexInGradient(s);
      const c = parsePosterHex(fallback);
      return c && posterLuminance(c) > 0.55 ? "#1a1a1a" : "#ffffff";
    }
    const maxLum = Math.max(...stops.map(posterLuminance));
    return maxLum > 0.55 ? "#1a1a1a" : "#ffffff";
  }
  const rgb = parsePosterHex(s) ?? parseRgbColor(s);
  if (!rgb) return "#1a1a1a";
  return posterLuminance(rgb) > 0.55 ? "#1a1a1a" : "#ffffff";
}
