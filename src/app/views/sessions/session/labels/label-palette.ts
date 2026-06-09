export interface LabelColor {
  key: string;
  label: string;
  background: string;
  text: string;
}

export const DEFAULT_LABEL_COLOR_KEY = "orange";

// User-selectable label colors shown in the label editor.
export const LABEL_PALETTE: LabelColor[] = [
  { key: "orange", label: "Orange", background: "#fd7e14", text: "#212529" },
  { key: "danger", label: "Red", background: "#dc3545", text: "#ffffff" },
  { key: "purple", label: "Purple", background: "#6f42c1", text: "#ffffff" },
  { key: "primary", label: "Blue", background: "#0d6efd", text: "#ffffff" },
  { key: "warning", label: "Yellow", background: "#ffc107", text: "#212529" },
  { key: "success", label: "Green", background: "#198754", text: "#ffffff" },
  { key: "info", label: "Cyan", background: "#0dcaf0", text: "#212529" },
  { key: "pink", label: "Pink", background: "#d63384", text: "#ffffff" },
  { key: "teal", label: "Teal", background: "#20c997", text: "#212529" },
];

// Reserved color for the "+N" overflow indicator in label renderings. Also
// resolvable via getLabelColor("grey") so any pre-existing labels stored with
// this key still render with the same color.
export const OVERFLOW_LABEL_COLOR: LabelColor = {
  key: "grey",
  label: "Grey",
  background: "#6c757d",
  text: "#ffffff",
};

const PALETTE_MAP = new Map<string, LabelColor>(
  [...LABEL_PALETTE, OVERFLOW_LABEL_COLOR].map((c) => [c.key, c]),
);

export function getLabelColor(key: string): LabelColor {
  return PALETTE_MAP.get(key) ?? PALETTE_MAP.get(DEFAULT_LABEL_COLOR_KEY)!;
}
