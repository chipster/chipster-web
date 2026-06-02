export interface LabelColor {
  key: string;
  label: string;
  background: string;
  text: string;
}

export const DEFAULT_LABEL_COLOR_KEY = "primary";

export const LABEL_PALETTE: LabelColor[] = [
  { key: "primary", label: "Blue", background: "#0d6efd", text: "#ffffff" },
  { key: "success", label: "Green", background: "#198754", text: "#ffffff" },
  { key: "danger", label: "Red", background: "#dc3545", text: "#ffffff" },
  { key: "warning", label: "Yellow", background: "#ffc107", text: "#212529" },
  { key: "info", label: "Cyan", background: "#0dcaf0", text: "#212529" },
  { key: "purple", label: "Purple", background: "#6f42c1", text: "#ffffff" },
  { key: "pink", label: "Pink", background: "#d63384", text: "#ffffff" },
  { key: "grey", label: "Grey", background: "#6c757d", text: "#ffffff" },
];

const PALETTE_MAP = new Map(LABEL_PALETTE.map((c) => [c.key, c]));

export function getLabelColor(key: string): LabelColor {
  return PALETTE_MAP.get(key) ?? PALETTE_MAP.get(DEFAULT_LABEL_COLOR_KEY);
}
