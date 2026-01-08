// web/services/dslToCanonical.js

export function dslConditionToCanonical(condition) {
  if (!condition || !condition.field) return null;

  let { field, op, value, negate } = condition;

  // ✅ DEFAULT OPERATOR FOR TEXT FIELDS
  if (!op) {
    op = "is";
  }

  // ✅ SPECIAL HANDLING FOR COLLECTION FIELD
  // collectionIds is an array field in MongoDB, so we need to use $in operator
  if (field === "product.collectionId" && (op === "is" || op === "is_not")) {
    return {
      field,
      op: op === "is" ? "in" : "not_in",
      value: [value], // ✅ Wrap single value in array for $in query
      negate: false, // Already handled by in/not_in operators
    };
  }

  // ✅ ENUM / MULTI-SELECT (status, future enums)
  if (field === "status" && (op === "is" || op === "is_not")) {
    const values = Array.isArray(value) ? value : [value];

    return {
      field,
      op: op === "is" ? "in" : "not_in",
      value: values,
      negate: false,
    };
  }

  if (op === "is_after" || op === "is_before") {
  finalValue = new Date(value);
  if (isNaN(finalValue.getTime())) {
    console.warn("[dslToCanonical] Invalid date:", value);
    return null;
  }
}


  // ✅ OPERATOR MAP - includes date operators now!
  const OPERATOR_MAP = {
    // Text operators
    is: "is",
    is_not: "is_not",
    contains: "contains",
    not_contains: "not_contains",
    starts_with: "starts_with",
    not_starts_with: "not_starts_with",
    ends_with: "ends_with",
    contains_any: "contains_any",
    is_blank: "is_blank",
    is_not_blank: "is_not_blank",
    equals_ci: "equals_ci",
    contains_ci: "contains_ci",

    // Number operators
    eq: "eq",
    neq: "neq",
    gt: "gt",
    gte: "gte",
    lt: "lt",
    lte: "lte",
    between: "between",

    // Date operators - ADDED!
    is_after: "is_after",
    is_before: "is_before",
    is_after_days: "relative_after",
    is_before_days: "relative_before",
  };

  const canonicalOp = OPERATOR_MAP[op];

  if (!canonicalOp) {
    console.warn("[dslToCanonical] ❌ Unsupported operator:", op);
    return null;
  }

  // ✅ Convert days to number for relative date operators
  let finalValue = value;
  if (op === "is_after_days" || op === "is_before_days") {
    finalValue = Number(value);
    if (isNaN(finalValue)) {
      console.warn(
        "[dslToCanonical] ⚠️ Invalid number for relative date:",
        value
      );
      return null;
    }
  }

  const canonical = {
    field,
    op: canonicalOp,
    value: finalValue,
  };

  if (negate) canonical.negate = true;

  return canonical;
}
