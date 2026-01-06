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
if (
  field === "status" &&
  (op === "is" || op === "is_not")
) {
  const values = Array.isArray(value) ? value : [value];

  return {
    field,
    op: op === "is" ? "in" : "not_in",
    value: values,
    negate: false,
  };
}



const OPERATOR_MAP = {
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
