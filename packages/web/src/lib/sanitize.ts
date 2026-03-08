import DOMPurify from "dompurify";

/**
 * Safely sanitize HTML for display. Never throws - falls back to escaped text on error.
 */
export function safeSanitizeHtml(html: unknown): string {
  try {
    const str = typeof html === "string" ? html : String(html ?? "");
    return DOMPurify.sanitize(str);
  } catch {
    const str = String(html ?? "");
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
