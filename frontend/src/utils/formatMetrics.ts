/** Format project square footage for display (no decimal noise). */
export function formatSquareFootage(
  value: string | number | null | undefined,
): string {
  if (value == null || value === "" || value === "N/A") return "N/A";
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(parsed)) return String(value);
  return Math.round(parsed).toLocaleString();
}

export function formatBlueprintMetricValue(
  key: string,
  value: unknown,
): string {
  if (value == null) return "—";
  if (typeof value === "number") {
    if (key.endsWith("_sf") || key.includes("square")) {
      return Math.round(value).toLocaleString();
    }
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}
