// filters/operatorMap.ts

export const UI_TO_DSL_OPERATOR_MAP: Record<string, string> = {
  // equality
  equals: "is",
  "does not equal": "is_not",

  // string
  contains: "contains",
  "does not contain": "not_contains",
  "starts with": "starts_with",
  "does not start with": "not_starts_with", // optional
  "ends with": "ends_with",

  // blank
  "is empty/blank": "is_blank",
  "is not empty/blank": "is_not_blank",

  // case-insensitive (map to same DSL for now)
  "equals (case insensitive)": "is",
  "contains (case insensitive)": "contains",
};
