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
  const solid = isGradient(bgColor) ? getSolidColorForContrast(bgColor) : bgColor;
  const rgb = parseColor(solid);
  if (!rgb) return "var(--cyh-text, #1f2937)";
  const lum = getLuminance(rgb.r, rgb.g, rgb.b);
  return lum > 0.55 ? "#1a1a1a" : "#ffffff";
}

export function resolveEventColor(
  event: Pick<EmbedEvent, "color" | "categories" | "orgCategories">,
  primaryColor = "var(--cyh-primary, #4f46e5)"
): string {
  if (event.color) return event.color;
  const cats = event.orgCategories?.length ? event.orgCategories : event.categories ?? [];
  const catColor = cats[0]?.color;
  if (catColor) return catColor;
  return primaryColor;
}

/** True if the value is a CSS gradient (e.g. linear-gradient(...)) */
export function isGradient(value: string): boolean {
  return typeof value === "string" && value.trim().startsWith("linear-gradient");
}

/** Extract first hex color from gradient for text contrast, or return value if solid. */
export function getSolidColorForContrast(value: string): string {
  if (!value || isGradient(value)) {
    const match = value?.match(/#[0-9a-fA-F]{3,6}/);
    return match ? match[0] : "#4f46e5";
  }
  return value;
}
