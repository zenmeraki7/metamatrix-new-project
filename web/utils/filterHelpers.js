// web/utils/filterHelpers.js
export function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeArrayValue(value) {
  if (Array.isArray(value)) return value.filter((v) => v != null && v !== "");
  if (value == null) return [];
  return String(value)
    .split(/[,\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export function buildBetween(field, value) {
  if (!value) return {};
  const { min, max } = value;
  const query = {};
  if (min != null) query.$gte = min;
  if (max != null) query.$lte = max;
  return Object.keys(query).length ? { [field]: query } : {};
}

export function computeRelativeDateBoundary(opts) {
  const { amount, unit, direction = "past", now = new Date() } = opts;
  const sign = direction === "past" ? -1 : 1;
  const d = new Date(now);
  switch (unit) {
    case "weeks":
      d.setDate(d.getDate() + sign * amount * 7);
      break;
    case "months":
      d.setMonth(d.getMonth() + sign * amount);
      break;
    case "days":
    default:
      d.setDate(d.getDate() + sign * amount);
      break;
  }
  return d;
}
