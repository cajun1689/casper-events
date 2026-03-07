/**
 * Convert RRULE to a short human-readable string.
 * Falls back to raw rule if parsing fails.
 */
const DAY_ABBREV: Record<string, string> = {
  MO: "Mondays",
  TU: "Tuesdays",
  WE: "Wednesdays",
  TH: "Thursdays",
  FR: "Fridays",
  SA: "Saturdays",
  SU: "Sundays",
};

export function formatRecurrenceRule(rule: string | null | undefined): string | null {
  if (!rule || !rule.trim()) return null;
  const r = rule.toUpperCase().trim();
  const parts: string[] = [];
  const freqMatch = r.match(/FREQ=(\w+)/);
  const freq = freqMatch ? freqMatch[1] : null;
  if (freq) {
    const freqLabels: Record<string, string> = {
      DAILY: "Daily",
      WEEKLY: "Weekly",
      MONTHLY: "Monthly",
      YEARLY: "Yearly",
    };
    parts.push(freqLabels[freq] ?? freq);
  }
  const bydayMatch = r.match(/BYDAY=([\w,]+)/);
  if (bydayMatch) {
    const days = bydayMatch[1].split(",").map((d) => DAY_ABBREV[d] ?? d);
    if (days.length > 0) parts.push(`on ${days.join(", ")}`);
  }
  if (parts.length === 0) return rule;
  return parts.join(" ");
}
