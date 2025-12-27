// filters/registry.ts

export type FilterFieldType =
  | "text"
  | "number"
  | "date"
  | "enum"
  | "multi_enum"
  | "range"
  | "metafield";

export const FILTER_REGISTRY = {
  /* ---------------- TEXT ---------------- */

  "product.title": {
    label: "Title",
    type: "text",
    operators: [
      "contains",
      "equals",
      "starts_with",
      "ends_with",
      "is_blank",
      "is_not_blank",
    ],
  },

  "product.handle": {
    label: "Handle",
    type: "text",
    operators: ["contains", "equals", "starts_with"],
  },

  "product.description": {
    label: "Description",
    type: "text",
    operators: ["contains", "is_blank", "is_not_blank"],
  },

  "product.vendor": {
    label: "Vendor",
    type: "text",
    operators: ["contains", "equals"],
  },

  "product.productType": {
    label: "Product type",
    type: "text",
    operators: ["contains", "equals"],
  },

  "variant.sku": {
    label: "SKU",
    type: "text",
    operators: ["contains", "equals"],
  },

  "variant.barcode": {
    label: "Barcode",
    type: "text",
    operators: ["contains", "equals"],
  },

  /* ---------------- ENUM ---------------- */

  "product.status": {
    label: "Status",
    type: "enum",
    operators: ["is", "is_not"],
    values: ["ACTIVE", "DRAFT", "ARCHIVED"],
  },

  "product.collectionId": {
    label: "Collection",
    type: "enum",
    operators: ["is", "is_not", "contains_any_ids"],
  },

  "product.tags": {
    label: "Tags",
    type: "multi_enum",
    operators: ["contains_any", "contains_all"],
  },

  /* ---------------- NUMBER ---------------- */

  "variant.price": {
    label: "Price",
    type: "number",
    operators: ["eq", "gt", "gte", "lt", "lte"],
  },

  "variant.compareAtPrice": {
    label: "Compare at price",
    type: "number",
    operators: ["eq", "gt", "lt"],
  },

  /* ---------------- RANGE ---------------- */

  "product.totalInventory": {
    label: "Inventory",
    type: "range",
    operators: ["between", "gt", "lt"],
  },

  /* ---------------- DATE ---------------- */

  "product.createdAt": {
    label: "Created date",
    type: "date",
    operators: [
      "is_after",
      "is_before",
      "is_after_days",
      "is_before_days",
    ],
  },

  "product.updatedAt": {
    label: "Updated date",
    type: "date",
    operators: [
      "is_after",
      "is_before",
      "is_after_days",
      "is_before_days",
    ],
  },

  "product.publishedAt": {
    label: "Published date",
    type: "date",
    operators: [
      "is_after",
      "is_before",
      "is_after_days",
      "is_before_days",
    ],
  },

  /* ---------------- METAFIELD ---------------- */

  "metafield": {
    label: "Metafield",
    type: "metafield",
    operators: [
      "eq",
      "contains",
      "gt",
      "lt",
      "exists",
      "not_exists",
    ],
  },
} as const;
