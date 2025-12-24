// filters/buildFilterDsl.ts (UPDATED)

import { FiltersState } from "../filterstate/filtersState";

export function buildFilterDsl(filters: FiltersState) {
  const and: any[] = [];

  // Status
  if (filters.status.length) {
    and.push({
      condition: {
        field: "product.status",
        op: "in",
        value: filters.status,
      },
    });
  }

  // Text filters
  addTextFilter(and, "product.vendor", filters.vendor);
  addTextFilter(and, "product.title", filters.title);
  addTextFilter(and, "product.handle", filters.handle);
  addTextFilter(and, "product.description", filters.description);
  addTextFilter(and, "variant.sku", filters.sku);
  addTextFilter(and, "product.productType", filters.productType);
  addTextFilter(and, "product.tags", filters.tag);
  addTextFilter(and, "variant.barcode", filters.barcode);
  addTextFilter(and, "product.themeTemplate", filters.themeTemplate);
  addTextFilter(and, "variant.optionOne", filters.optionOne);

  // Enum filters
  addEnumFilter(and, "product.collectionId", filters.collection);
  addEnumFilter(and, "product.productCategory", filters.productCategory);

  // Price filter
  if (filters.price.value) {
    and.push({
      condition: {
        field: "variant.price",
        op: filters.price.op,
        value: Number(filters.price.value),
      },
    });
  }

  // Inventory filter
  const minInv = Number(filters.inventory.min);
  const maxInv = Number(filters.inventory.max);

  if (!isNaN(minInv) && filters.inventory.min !== "") {
    and.push({
      condition: {
        field: "product.totalInventory",
        op: "gte",
        value: minInv,
      },
    });
  }

  if (!isNaN(maxInv) && filters.inventory.max !== "") {
    and.push({
      condition: {
        field: "product.totalInventory",
        op: "lte",
        value: maxInv,
      },
    });
  }

  // Date filters
  addDateFilter(and, "product.createdAt", filters.dateCreated);
  addDateFilter(and, "product.updatedAt", filters.dateUpdated);
  addDateFilter(and, "product.publishedAt", filters.datePublished);

  // Metafield filter
  if (filters.metafield.namespace && filters.metafield.key) {
    const cond: any = {
      field: "metafield",
      op: filters.metafield.op,
      meta: {
        owner: filters.metafield.owner,
        namespace: filters.metafield.namespace,
        key: filters.metafield.key,
        type: filters.metafield.type,
      },
    };

    if (!["exists", "not_exists"].includes(filters.metafield.op)) {
      cond.value = filters.metafield.value;
    }

    and.push({ condition: cond });
  }

  return and.length ? { and } : null;
}

/* ---------------- Helper Functions ---------------- */

function addTextFilter(and: any[], field: string, filter: any) {
  if (!filter.value && !["is_blank", "is_not_blank"].includes(filter.op)) {
    return;
  }

  and.push({
    condition: {
      field,
      op: filter.op,
      ...(filter.value ? { value: filter.value } : {}),
    },
  });
}

function addEnumFilter(and: any[], field: string, filter: any) {
  if (!filter.value) return;

  and.push({
    condition: {
      field,
      op: filter.op,
      value: filter.value,
    },
  });
}

function addDateFilter(and: any[], field: string, filter: any) {
  if (!filter.value) return;

  if (filter.op.endsWith("_days")) {
    and.push({
      condition: {
        field,
        op: filter.op,
        value: Number(filter.value),
      },
    });
  } else {
    and.push({
      condition: {
        field,
        op: filter.op,
        value: filter.value,
      },
    });
  }
}