/**
 * Escape text for use in HTML
 *
 * Use this for any user-controlled text, like dataset names or the headers of a
 * file, that goes into innerHTML, d3's .html() or a library that renders its
 * input as HTML. Prefer setting textContent (d3's .text()) when the element
 * doesn't need any markup of its own.
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * The inverse of escapeHtml(): unescapeHtml(escapeHtml(s)) === s for any s.
 *
 * Only for text that escapeHtml() produced, e.g. to read back the original
 * text from a library that was given the escaped form. Not a general HTML
 * entity decoder.
 */
export function unescapeHtml(s: string): string {
  // & last, so that an "&amp;lt;" from an original "&lt;" doesn't become "<"
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}
