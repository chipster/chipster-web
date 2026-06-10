export interface LabelColor {
  hex: string; // stored in label.color
  name: string; // shown as swatch tooltip
}

// User-selectable label colors shown in the label editor.
export const LABEL_PALETTE: LabelColor[] = [
  { hex: "#6f42c1", name: "Purple" },
  { hex: "#fd7e14", name: "Orange" },
  { hex: "#dc3545", name: "Red" },
  { hex: "#0d6efd", name: "Blue" },
  { hex: "#ffc107", name: "Yellow" },
  { hex: "#198754", name: "Green" },
  { hex: "#0dcaf0", name: "Cyan" },
  { hex: "#d63384", name: "Pink" },
  { hex: "#20c997", name: "Teal" },
];

export const DEFAULT_LABEL_COLOR = LABEL_PALETTE[0].hex;

// Reserved color for the "+N" overflow indicator in label renderings.
export const OVERFLOW_LABEL_COLOR = "#6c757d";

const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/i;

// Returns the stored color if it's a valid CSS hex, otherwise the default.
// Guards renderers against malformed or legacy values without mutating the
// stored data.
export function resolveLabelColor(stored: string | null | undefined): string {
  return stored && HEX_COLOR_REGEX.test(stored) ? stored : DEFAULT_LABEL_COLOR;
}

// Returns a readable text color (dark or white) for the given background hex,
// using the YIQ luminance rule (threshold 128). Caller should pass a valid
// hex — pre-resolve via resolveLabelColor() when handling stored values.
export function textColorForBackground(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#212529" : "#ffffff";
}
