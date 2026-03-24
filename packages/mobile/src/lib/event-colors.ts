/**
 * Re-exports shared poster/color helpers so all mobile components use the
 * same logic as the web.  Adds a few RN-specific utilities (hexToRgba,
 * resolveSolidColor) that the shared package doesn't need.
 */
export {
  resolvePosterEventColor as resolveColor,
  getTextColorForPosterBackground as getTextColor,
  isPosterGradient as isGradient,
  extractPosterGradientColors as extractGradientColors,
  getFirstHexInGradient as getSolidFromGradient,
  parsePosterHex as parseColor,
} from "@cyh/shared";

import type { EventWithDetails } from "@cyh/shared";
import {
  resolvePosterEventColor,
  isPosterGradient,
  getFirstHexInGradient,
  parsePosterHex,
} from "@cyh/shared";

/** Get the solid color for an event, extracting from gradient if needed. */
export function resolveSolidColor(event: EventWithDetails): string {
  const raw = resolvePosterEventColor(event);
  return isPosterGradient(raw) ? getFirstHexInGradient(raw) : raw;
}

/** Convert a hex color to an rgba() string (React Native compatible). */
export function hexToRgba(hex: string, alpha: number): string {
  const c = parsePosterHex(hex);
  if (!c) return `rgba(79, 70, 229, ${alpha})`;
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}
