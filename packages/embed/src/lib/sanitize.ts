import DOMPurify from "dompurify";

/**
 * Safely sanitize HTML for display. Never throws - falls back to escaped text on error.
 * Handles null/undefined, non-strings, and DOMPurify edge cases.
 */
export function safeSanitizeHtml(html: unknown): string {
  try {
    const str = typeof html === "string" ? html : String(html ?? "");
    const toSanitize = str.startsWith("<") ? str : str.replace(/\n/g, "<br/>");
    return DOMPurify.sanitize(toSanitize);
  } catch {
    // Fallback: escape HTML to prevent XSS
    const str = String(html ?? "");
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/\n/g, "<br/>");
  }
}
