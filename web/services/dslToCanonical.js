// web/services/dslToCanonical.js
export function dslConditionToCanonical(condition) {
  if (!condition || !condition.op || !condition.field) return null;

  const { field, op, value, negate } = condition;

  // Simplified mapping: DSL → canonical
  const canonical = { field, op, value };
  if (negate) canonical.negate = true;

  return canonical;
}
