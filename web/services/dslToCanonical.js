/* ------------------------------------------------------------------ */
/* DSL → Canonical (DEBUG ONLY, NO BEHAVIOR CHANGES)                   */
/* ------------------------------------------------------------------ */

export function dslConditionToCanonical(condition) {
  if (!condition || !condition.op || !condition.field) return null;

  const { field, op, value, negate } = condition;

  // ✅ DSL → canonical operator mapping
  const OPERATOR_MAP = {
    is: "eq",
    is_not: "neq",
    contains: "contains",
    not_contains: "not_contains",
    in: "in",
    not_in: "not_in",
    lt: "lt",
    lte: "lte",
    gt: "gt",
    gte: "gte",
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

