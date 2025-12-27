export const FILTER_REGISTRY = {
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

  "product.vendor": {
    label: "Vendor",
    type: "text",
    operators: ["contains", "equals"],
  },

  "variant.price": {
    label: "Price",
    type: "number",
    operators: ["eq", "gt", "lt", "gte", "lte"],
  },

  "product.createdAt": {
    label: "Created date",
    type: "date",
    operators: ["is_after", "is_before", "is_after_days"],
  },

  "product.collectionId": {
    label: "Collection",
    type: "enum",
    operators: ["is", "is_not", "contains_any_ids"],
  },
};
