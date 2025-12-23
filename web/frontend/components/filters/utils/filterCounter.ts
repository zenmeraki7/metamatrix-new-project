// utils/filterCounter.ts

import { FiltersState } from "../filters/filtersState";

export function countAppliedFilters(filters: FiltersState): number {
  let count = 0;

  // Status
  if (filters.status.length) count++;

  // Text filters
  const textFilters = [
    filters.vendor,
    filters.title,
    filters.handle,
    filters.description,
    filters.sku,
    filters.productType,
    filters.tag,
    filters.barcode,
    filters.themeTemplate,
    filters.optionOne,
  ];

  textFilters.forEach((f) => {
    if (f.value || ["is_blank", "is_not_blank"].includes(f.op)) count++;
  });

  // Enum filters
  if (filters.collection.value) count++;
  if (filters.productCategory.value) count++;

  // Number filters
  if (filters.price.value) count++;

  // Inventory
  if (filters.inventory.min || filters.inventory.max) count++;

  // Date filters
  if (filters.dateCreated.value) count++;
  if (filters.dateUpdated.value) count++;
  if (filters.datePublished.value) count++;

  // Metafield
  if (filters.metafield.namespace && filters.metafield.key) count++;

  return count;
}