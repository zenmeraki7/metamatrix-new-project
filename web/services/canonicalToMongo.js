// web/services/canonicalToMongo.js
import { escapeRegExp, normalizeArrayValue, buildBetween, computeRelativeDateBoundary } from "../utils/filterHelpers.js";

export function canonicalToMongo(canonical) {
  if (!canonical || !canonical.op || !canonical.field) return {};

  const { op, field, value } = canonical;

  switch (op) {
    case "eq": return { [field]: value };
    case "neq": return { [field]: { $ne: value } };
    case "lt": return { [field]: { $lt: value } };
    case "lte": return { [field]: { $lte: value } };
    case "gt": return { [field]: { $gt: value } };
    case "gte": return { [field]: { $gte: value } };
    case "between": return buildBetween(field, value);
    case "contains": return { [field]: { $regex: escapeRegExp(value), $options: "i" } };
    case "not_contains": return { [field]: { $not: { $regex: escapeRegExp(value), $options: "i" } } };
    case "starts_with": return { [field]: { $regex: `^${escapeRegExp(value)}`, $options: "i" } };
    case "ends_with": return { [field]: { $regex: `${escapeRegExp(value)}$`, $options: "i" } };
    case "in": return { [field]: { $in: normalizeArrayValue(value) } };
    case "not_in": return { [field]: { $nin: normalizeArrayValue(value) } };
    case "date_before": return { [field]: { $lt: new Date(value) } };
    case "date_after": return { [field]: { $gt: new Date(value) } };
    case "relative_date_before":
      return { [field]: { $lt: computeRelativeDateBoundary(value) } };
    case "relative_date_after":
      return { [field]: { $gt: computeRelativeDateBoundary(value) } };
    default: return {};
  }
}
