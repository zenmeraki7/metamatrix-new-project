// web/services/dslToCanonical.js

export function dslConditionToCanonical(condition) {
  if (!condition || !condition.op || !condition.field) return null;

  const { field, op, value, negate } = condition;

  // ✅ SPECIAL HANDLING FOR COLLECTION FIELD
  // collectionIds is an array field in MongoDB, so we need to use $in operator
  if (field === "product.collectionId" && (op === "is" || op === "is_not")) {
    return {
      field,
      op: op === "is" ? "in" : "not_in",
      value: [value], // ✅ Wrap single value in array for $in query
      negate: false   // Already handled by in/not_in operators
    };
  }

  const OPERATOR_MAP = {
    // equality
    is: "eq",
    is_not: "neq",

    // string
    contains: "contains",
    not_contains: "not_contains",
    starts_with: "starts_with",
    ends_with: "ends_with",

    // array
    in: "in",
    not_in: "not_in",
    contains_any: "in",      // for tags with array values
    contains_all: "all_in",  // for tags (if you implement $all)

    // number
    lt: "lt",
    lte: "lte",
    gt: "gt",
    gte: "gte",
    eq: "eq",

    // range
    between: "between",

    // date
    is_before: "date_before",
    is_after: "date_after",
    is_before_days: "relative_date_before",
    is_after_days: "relative_date_after",
  };

  const canonicalOp = OPERATOR_MAP[op];

  if (!canonicalOp) {
    console.warn("[dslToCanonical] ❌ Unsupported operator:", op);
    return null;
  }

  const canonical = {
    field,
    op: canonicalOp,
    value,
  };

  if (negate) canonical.negate = true;

  return canonical;
}