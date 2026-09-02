import { Label } from "chipster-js-common";

export function getSortedLabels(
  labelIds: string[] | undefined | null,
  labelsMap: Map<string, Label>,
): Label[] {
  return (labelIds ?? [])
    .map((id) => labelsMap.get(id))
    .filter((l): l is Label => l != null)
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
}
