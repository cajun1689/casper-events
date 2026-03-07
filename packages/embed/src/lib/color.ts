import type { EmbedEvent } from "../types";

export function parseColor(color: string): { r: number; g: number; b: number } | null {
  if (!color || typeof color !== "string") return null;
  const s = color.trim();

  // #rrggbb or #rgb
  const hex = s.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hex) {
    const h = hex[1];
    if (h.length === 3) {
      return {
        r: parseInt(h[0] + h[0], 16),
        g: parseInt(h[1] + h[1], 16),
        b: parseInt(h[2] + h[2], 16),
      };
    }
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgb = s.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) {
    return {
      r: parseInt(rgb[1], 10),
      g: parseInt(rgb[2], 10),
      b: parseInt(rgb[3], 10),
    };
  }

  return null;
}

export function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function getTextColor(bgColor: string): string {
  const rgb = parseColor(bgColor);
  if (!rgb) return "var(--cyh-text, #1f2937)";
  const lum = getLuminance(rgb.r, rgb.g, rgb.b);
  return lum > 0.55 ? "#1a1a1a" : "#ffffff";
}

export function resolveEventColor(
  event: Pick<EmbedEvent, "color" | "categories">,
  primaryColor = "var(--cyh-primary, #4f46e5)"
): string {
  if (event.color) return event.color;
  const catColor = event.categories?.[0]?.color;
  if (catColor) return catColor;
  return primaryColor;
}
