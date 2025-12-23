// filters/filtersState.ts (UPDATED)

export type TextOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "is_blank"
  | "is_not_blank"
  | "contains_ci"
  | "not_contains_ci"
  | "contains_any_words"
  | "contains_cs"
  | "equals_cs"
  | "not_starts_with";

export type NumberOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte";

export type DateOperator =
  | "is_after"
  | "is_before"
  | "is_after_days"
  | "is_before_days";

export type EnumOperator = "is" | "is_not";

export type TextFilter = {
  op: TextOperator;
  value: string;
};

export type NumberFilter = {
  op: NumberOperator;
  value: string;
};

export type DateFilterValue = {
  op: DateOperator;
  value: string;
};

export type EnumFilter = {
  op: EnumOperator;
  value: string;
};

export type InventoryFilter = {
  min: string;
  max: string;
};

export type MetafieldFilter = {
  owner: "PRODUCT" | "VARIANT";
  namespace: string;
  key: string;
  type: string;
  op: "eq" | "contains" | "gt" | "lt" | "exists" | "not_exists";
  value: string;
};

export type FiltersState = {
  status: string[];

  // Text filters
  vendor: TextFilter;
  title: TextFilter;
  handle: TextFilter;
  description: TextFilter;
  sku: TextFilter;
  productType: TextFilter;
  tag: TextFilter;
  barcode: TextFilter;
  themeTemplate: TextFilter;
  optionOne: TextFilter;

  // Enum filters
  collection: EnumFilter;
  productCategory: EnumFilter;

  // Number filters
  price: NumberFilter;
  inventory: InventoryFilter;

  // Date filters
  dateCreated: DateFilterValue;
  dateUpdated: DateFilterValue;
  datePublished: DateFilterValue;

  // Metafield filter
  metafield: MetafieldFilter;
};

export const DEFAULT_TEXT_FILTER: TextFilter = {
  op: "contains",
  value: "",
};

export const DEFAULT_NUMBER_FILTER: NumberFilter = {
  op: "eq",
  value: "",
};

export const DEFAULT_DATE_FILTER: DateFilterValue = {
  op: "is_after",
  value: "",
};

export const DEFAULT_ENUM_FILTER: EnumFilter = {
  op: "is",
  value: "",
};

export const DEFAULT_INVENTORY_FILTER: InventoryFilter = {
  min: "",
  max: "",
};

export const DEFAULT_METAFIELD_FILTER: MetafieldFilter = {
  owner: "PRODUCT",
  namespace: "",
  key: "",
  type: "single_line_text_field",
  op: "eq",
  value: "",
};

export const DEFAULT_FILTERS: FiltersState = {
  status: [],

  vendor: { ...DEFAULT_TEXT_FILTER },
  title: { ...DEFAULT_TEXT_FILTER },
  handle: { ...DEFAULT_TEXT_FILTER },
  description: { ...DEFAULT_TEXT_FILTER },
  sku: { ...DEFAULT_TEXT_FILTER },
  productType: { ...DEFAULT_TEXT_FILTER },
  tag: { ...DEFAULT_TEXT_FILTER },
  barcode: { ...DEFAULT_TEXT_FILTER },
  themeTemplate: { ...DEFAULT_TEXT_FILTER },
  optionOne: { ...DEFAULT_TEXT_FILTER },

  collection: { ...DEFAULT_ENUM_FILTER },
  productCategory: { ...DEFAULT_ENUM_FILTER },

  price: { ...DEFAULT_NUMBER_FILTER },
  inventory: { ...DEFAULT_INVENTORY_FILTER },

  dateCreated: { ...DEFAULT_DATE_FILTER },
  dateUpdated: { ...DEFAULT_DATE_FILTER },
  datePublished: { ...DEFAULT_DATE_FILTER },

  metafield: { ...DEFAULT_METAFIELD_FILTER },
};