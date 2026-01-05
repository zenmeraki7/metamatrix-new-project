// web/services/dslToCanonical.js

export function dslConditionToCanonical(condition) {
  if (!condition || !condition.op || !condition.field) return null;

  const { field, op, value, negate } = condition;

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

    // number
    lt: "lt",
    lte: "lte",
    gt: "gt",
    gte: "gte",

    // ✅ DATE (THIS WAS MISSING)
    is_before: "date_before",
    is_after: "date_after",
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
