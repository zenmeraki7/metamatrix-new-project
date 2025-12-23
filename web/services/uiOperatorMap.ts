import { CanonicalOp } from "./filterCanonical";

export const UI_TO_CANONICAL: Record<string, CanonicalOp> = {
  equals: CanonicalOp.TEXT_EQ,
  equals_ci: CanonicalOp.TEXT_EQ,

  contains: CanonicalOp.TEXT_CONTAINS,
  contains_ci: CanonicalOp.TEXT_CONTAINS_CI,
  not_contains: CanonicalOp.TEXT_CONTAINS,

  is_blank: CanonicalOp.IS_BLANK,
  is_not_blank: CanonicalOp.IS_NOT_BLANK,

  eq: CanonicalOp.NUM_EQ,
  neq: CanonicalOp.NUM_NEQ,
  gt: CanonicalOp.NUM_GT,
  gte: CanonicalOp.NUM_GTE,
  lt: CanonicalOp.NUM_LT,
  lte: CanonicalOp.NUM_LTE,
  between: CanonicalOp.NUM_BETWEEN,

  in: CanonicalOp.IN,
  not_in: CanonicalOp.NOT_IN,
  all_of: CanonicalOp.ALL_OF,

  date_before: CanonicalOp.DATE_BEFORE,
  date_after: CanonicalOp.DATE_AFTER,
  relative_date_before: CanonicalOp.DATE_RELATIVE_BEFORE,
  relative_date_after: CanonicalOp.DATE_RELATIVE_AFTER,
};
