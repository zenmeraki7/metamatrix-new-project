export enum CanonicalOp {
  TEXT_EQ,
  TEXT_CONTAINS,
  TEXT_CONTAINS_CI,

  IS_BLANK,
  IS_NOT_BLANK,

  NUM_EQ,
  NUM_NEQ,
  NUM_GT,
  NUM_GTE,
  NUM_LT,
  NUM_LTE,
  NUM_BETWEEN,

  IN,
  NOT_IN,
  ALL_OF,

  DATE_BEFORE,
  DATE_AFTER,
  DATE_RELATIVE_BEFORE,
  DATE_RELATIVE_AFTER,
}

export type CanonicalCondition = {
  field: string;
  op: CanonicalOp;
  value?: any;
  meta?: any;
  negate?: boolean;
};
