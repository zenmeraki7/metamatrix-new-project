import {
  escapeRegExp,
  normalizeArrayValue,
  buildBetween,
  computeRelativeDateBoundary,
} from "../utils/filterHelpers.js";

/**
 * mapOperatorToMongo
 *
 * input:
 *  - operator: string (e.g. "contains", "between", "relative_date_after")
 *  - field: string (mongo field path)
 *  - value: any (user input or structured object)
 *
 * output:
 *  - MongoDB query fragment
 */
export function mapOperatorToMongo(
  operator: string,
  field: string,
  value: any
): Record<string, any> {
  switch (operator) {
    /* ----------------------------------
     * TEXT OPERATORS
     * ---------------------------------- */

    case "equals":
      return { [field]: value };

    case "not_equals":
      return { [field]: { $ne: value } };

    case "equals_ci":
      return {
        [field]: {
          $regex: `^${escapeRegExp(value)}$`,
          $options: "i",
        },
      };

    case "contains":
      return {
        [field]: {
          $regex: escapeRegExp(value),
        },
      };

    case "contains_ci":
      return {
        [field]: {
          $regex: escapeRegExp(value),
          $options: "i",
        },
      };

    case "not_contains":
      return {
        [field]: {
          $not: { $regex: escapeRegExp(value) },
        },
      };

    case "starts_with":
      return {
        [field]: {
          $regex: `^${escapeRegExp(value)}`,
        },
      };

    case "not_starts_with":
      return {
        [field]: {
          $not: { $regex: `^${escapeRegExp(value)}` },
        },
      };

    case "ends_with":
      return {
        [field]: {
          $regex: `${escapeRegExp(value)}$`,
        },
      };

    case "not_ends_with":
      return {
        [field]: {
          $not: { $regex: `${escapeRegExp(value)}$` },
        },
      };

    case "contains_any_words": {
      const words = String(value)
        .split(/\s+/)
        .filter(Boolean)
        .map(escapeRegExp);

      if (!words.length) return {};
      return {
        [field]: {
          $regex: words.join("|"),
          $options: "i",
        },
      };
    }

    /* ----------------------------------
     * NULL / BLANK
     * ---------------------------------- */

    case "is_blank":
      return {
        $or: [
          { [field]: { $exists: false } },
          { [field]: null },
          { [field]: "" },
        ],
      };

    case "is_not_blank":
      return {
        [field]: {
          $exists: true,
          $ne: null,
          $ne: "",
        },
      };

    /* ----------------------------------
     * NUMBER / SCALAR
     * ---------------------------------- */

    case "eq":
      return { [field]: Number(value) };

    case "neq":
      return { [field]: { $ne: Number(value) } };

    case "lt":
      return { [field]: { $lt: Number(value) } };

    case "lte":
      return { [field]: { $lte: Number(value) } };

    case "gt":
      return { [field]: { $gt: Number(value) } };

    case "gte":
      return { [field]: { $gte: Number(value) } };

    case "between": {
      // value expected: { min?: number | Date, max?: number | Date }
      const normalized =
        typeof value === "object" && value !== null
          ? value
          : { min: undefined, max: undefined };
      return buildBetween(field, normalized);
    }

    /* ----------------------------------
     * ENUM / SIMPLE
     * ---------------------------------- */

    case "is":
      return { [field]: value };

    case "is_not":
      return { [field]: { $ne: value } };

    /* ----------------------------------
     * ARRAY / LIST (tags, collections)
     * ---------------------------------- */

    case "in": {
      const arr = normalizeArrayValue(value);
      if (!arr.length) return {};
      return { [field]: { $in: arr } };
    }

    case "not_in": {
      const arr = normalizeArrayValue(value);
      if (!arr.length) return {};
      return { [field]: { $nin: arr } };
    }

    // For "product has ANY of these tags/collections"
    case "any_of": {
      const arr = normalizeArrayValue(value);
      if (!arr.length) return {};
      return { [field]: { $in: arr } };
    }

    // For "product has NONE of these tags/collections"
    case "none_of": {
      const arr = normalizeArrayValue(value);
      if (!arr.length) return {};
      return { [field]: { $nin: arr } };
    }

    // For "product has ALL of these tags/collections"
    case "all_of": {
      const arr = normalizeArrayValue(value);
      if (!arr.length) return {};
      return { [field]: { $all: arr } };
    }

    /* ----------------------------------
     * ABSOLUTE DATES
     *
     * value is expected to be a Date or ISO string.
     * ---------------------------------- */

    case "date_before": {
      if (!value) return {};
      const date = value instanceof Date ? value : new Date(value);
      return { [field]: { $lt: date } };
    }

    case "date_after": {
      if (!value) return {};
      const date = value instanceof Date ? value : new Date(value);
      return { [field]: { $gt: date } };
    }

    case "date_on_or_before": {
      if (!value) return {};
      const date = value instanceof Date ? value : new Date(value);
      return { [field]: { $lte: date } };
    }

    case "date_on_or_after": {
      if (!value) return {};
      const date = value instanceof Date ? value : new Date(value);
      return { [field]: { $gte: date } };
    }

    /* ----------------------------------
     * RELATIVE DATES
     *
     * value shape: {
     *   amount: number;
     *   unit: "days" | "weeks" | "months";
     *   direction?: "past" | "future";
     * }
     * ---------------------------------- */

    // "relative_date_before":
    // e.g. "created before 7 days ago" => field < boundary
    case "relative_date_before": {
      if (!value || typeof value !== "object") return {};
      const boundary = computeRelativeDateBoundary({
        amount: Number(value.amount ?? 0),
        unit: value.unit ?? "days",
        direction: value.direction ?? "past",
      });
      return { [field]: { $lt: boundary } };
    }

    // "relative_date_after":
    // e.g. "created in last 7 days" => field > boundary
    case "relative_date_after": {
      if (!value || typeof value !== "object") return {};
      const boundary = computeRelativeDateBoundary({
        amount: Number(value.amount ?? 0),
        unit: value.unit ?? "days",
        direction: value.direction ?? "past",
      });
      return { [field]: { $gt: boundary } };
    }

    /* ----------------------------------
     * ID LIST
     * ---------------------------------- */

    case "contains_any_ids": {
      const ids = normalizeArrayValue(value);
      if (!ids.length) return {};
      return {
        [field]: { $in: ids },
      };
    }

    /* ----------------------------------
     * FALLBACK
     * ---------------------------------- */

    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}
