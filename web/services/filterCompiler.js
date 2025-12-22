// services/filterCompiler.js (FIXED VERSION)
import { Types } from "mongoose";
import { Product, Variant, InventoryLevel, Metafield } from "../models/index.js";

/* ============================
 * Constants / Safety limits
 * ============================ */

const MAX_PRODUCT_IDS = 5000;
const MAX_VARIANT_IDS = 10000;

/* ============================
 * Field maps
 * ============================ */

const PRODUCT_FIELD_MAP = {
  "product.title": "title",
  "product.handle": "handle",
  "product.status": "status",
  "product.vendor": "vendor",
  "product.productType": "productType",
  "product.tags": "tags",
  "product.totalInventory": "totalInventory",
  "product.variantCount": "variantCount",
  "product.collectionIds": "collectionIds",
};

const VARIANT_FIELD_MAP = {
  "variant.price": "price",
  "variant.compareAtPrice": "compareAtPrice",
  "variant.cost": "cost",
  "variant.sku": "sku",
  "variant.barcode": "barcode",
  "variant.inventoryTracked": "inventoryTracked",
  "variant.inventoryPolicy": "inventoryPolicy",
  "variant.requiresShipping": "requiresShipping",
  "variant.taxable": "taxable",
};

const INVENTORY_FIELD_MAP = {
  "inventory.available": "available",
};

/* ============================
 * Helpers
 * ============================ */

function escapeRegex(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeRange(op, value) {
  if (Array.isArray(value) && value.length === 2 && value[0] === value[1]) {
    return { op: "eq", value: value[0] };
  }
  return { op, value };
}

function compileOperator(field, op, value) {
  const norm = normalizeRange(op, value);
  op = norm.op;
  value = norm.value;

  // Special handling for numeric fields that might be null
  const isNumericField = ['totalInventory', 'variantCount', 'price', 'compareAtPrice', 'cost', 'available'].includes(field);
  
  switch (op) {
    case "eq": 
      if (isNumericField && value === 0) {
        // Match both 0 and null for zero comparisons
        return { $or: [{ [field]: 0 }, { [field]: null }, { [field]: { $exists: false } }] };
      }
      return { [field]: value };
    case "neq": return { [field]: { $ne: value } };
    case "gt": return { [field]: { $gt: value } };
    case "gte": 
      if (isNumericField && value === 0) {
        // For >= 0, include null values (treat as 0)
        return { $or: [{ [field]: { $gte: 0 } }, { [field]: null }, { [field]: { $exists: false } }] };
      }
      return { [field]: { $gte: value } };
    case "lt": return { [field]: { $lt: value } };
    case "lte":
      if (isNumericField && value === 0) {
        // For <= 0, include null values (treat as 0) and negative numbers
        return { $or: [{ [field]: { $lte: 0 } }, { [field]: null }, { [field]: { $exists: false } }] };
      }
      return { [field]: { $lte: value } };
    case "between": 
      if (isNumericField && value[0] <= 0 && value[1] >= 0) {
        // Range includes 0, so include nulls
        return { $or: [
          { [field]: { $gte: value[0], $lte: value[1] } },
          { [field]: null },
          { [field]: { $exists: false } }
        ]};
      }
      return { [field]: { $gte: value[0], $lte: value[1] } };
    case "contains": return { [field]: { $regex: escapeRegex(value), $options: "i" } };
    case "not_contains": return { [field]: { $not: { $regex: escapeRegex(value), $options: "i" } } };
    case "starts_with": return { [field]: { $regex: `^${escapeRegex(value)}`, $options: "i" } };
    case "ends_with": return { [field]: { $regex: `${escapeRegex(value)}$`, $options: "i" } };
    case "exists": return { [field]: { $exists: true } };
    case "not_exists": return { [field]: { $exists: false } };
    case "in": return { [field]: { $in: value } };
    case "not_in": return { [field]: { $nin: value } };
    default: throw new Error(`Unsupported operator: ${op}`);
  }
}

/* ============================
 * NEW: Merge conditions helper
 * ============================ */

function mergeConditions(conditions) {
  const merged = {};
  const nonMergeable = [];

  for (const cond of conditions) {
    // Handle special cases that shouldn't be merged
    if (cond.$or || cond.$nor || cond.$not || cond.__meta) {
      nonMergeable.push(cond);
      continue;
    }

    // Merge field conditions
    for (const [field, value] of Object.entries(cond)) {
      if (!merged[field]) {
        merged[field] = value;
      } else {
        // Merge operators on the same field
        if (typeof value === 'object' && !Array.isArray(value) && value !== null &&
            typeof merged[field] === 'object' && !Array.isArray(merged[field]) && merged[field] !== null) {
          merged[field] = { ...merged[field], ...value };
        } else {
          // Can't merge, push to non-mergeable
          nonMergeable.push({ [field]: value });
        }
      }
    }
  }

  const result = [];
  
  // Add merged conditions
  for (const [field, value] of Object.entries(merged)) {
    result.push({ [field]: value });
  }
  
  // Add non-mergeable conditions
  result.push(...nonMergeable);

  return result;
}

/* ============================
 * Metafields (SAFE)
 * ============================ */

async function resolveMetafieldToProductIds(cond) {
  const { owner, namespace, key, type } = cond.meta;

  const base = { ownerType: owner, namespace, key };
  if (type) base.type = type;

  const rows = await Metafield.aggregate([
    { $match: base },
    { $group: { _id: "$ownerId" } },
    { $limit: MAX_VARIANT_IDS }
  ]);

  const ownerIds = rows.map(r => r._id);
  if (!ownerIds.length) return [];

  if (owner === "PRODUCT") {
    return ownerIds.slice(0, MAX_PRODUCT_IDS);
  }

  if (owner === "VARIANT") {
    const vRows = await Variant.aggregate([
      { $match: { shopifyVariantId: { $in: ownerIds } } },
      { $group: { _id: "$shopifyProductId" } },
      { $limit: MAX_PRODUCT_IDS }
    ]);

    return vRows.map(r => r._id);
  }

  return [];
}

/* ============================
 * DSL splitter
 * ============================ */

function splitConditions(node, product, variant, inventory) {
  if (node.condition) {
    const c = node.condition;

    if (c.field === "metafield") {
      product.push({ __meta: c });
      return;
    }

    if (c.field in PRODUCT_FIELD_MAP) {
      product.push(compileOperator(PRODUCT_FIELD_MAP[c.field], c.op, c.value));
    } else if (c.field in VARIANT_FIELD_MAP) {
      variant.push(compileOperator(VARIANT_FIELD_MAP[c.field], c.op, c.value));
    } else if (c.field in INVENTORY_FIELD_MAP) {
      inventory.push(compileOperator(INVENTORY_FIELD_MAP[c.field], c.op, c.value));
    } else {
      throw new Error(`Unknown filter field: ${c.field}`);
    }
  }

  node.and?.forEach(n => splitConditions(n, product, variant, inventory));

  if (node.or) {
    const p = [], v = [], i = [];
    node.or.forEach(n => splitConditions(n, p, v, i));
    if (p.length) product.push({ $or: p });
    if (v.length) variant.push({ $or: v });
    if (i.length) inventory.push({ $or: i });
  }
}

/* ============================
 * Main entry (FIXED)
 * ============================ */

export async function compileFilter({ shopId, filter }) {
  const productConditions = [];
  const variantConditions = [];
  const inventoryConditions = [];

  splitConditions(filter, productConditions, variantConditions, inventoryConditions);

  let resolvedProductIds;

  // Inventory → Variant narrowing (SAFE)
  if (inventoryConditions.length) {
    const merged = mergeConditions(inventoryConditions);
    const invRows = await InventoryLevel.aggregate([
      { $match: merged.length === 1 ? merged[0] : { $and: merged } },
      { $group: { _id: "$inventoryItemId" } },
      { $limit: MAX_VARIANT_IDS }
    ]);

    if (!invRows.length) {
      return { productMatch: { _id: { $exists: false } } };
    }

    variantConditions.push({ inventoryItemId: { $in: invRows.map(r => r._id) } });
  }

  // Variant → Product narrowing (SAFE)
  if (variantConditions.length) {
    const merged = mergeConditions(variantConditions);
    const rows = await Variant.aggregate([
      { $match: merged.length === 1 ? merged[0] : { $and: merged } },
      { $group: { _id: "$shopifyProductId" } },
      { $limit: MAX_PRODUCT_IDS }
    ]);

    resolvedProductIds = rows.map(r => r._id);

    if (!resolvedProductIds.length) {
      return { productMatch: { _id: { $exists: false } } };
    }
  }

  // ✅ MERGE PRODUCT CONDITIONS
  const mergedProductConditions = mergeConditions(productConditions);

  const productMatch = {
    ...(mergedProductConditions.length === 1 
      ? mergedProductConditions[0] 
      : mergedProductConditions.length > 1 
        ? { $and: mergedProductConditions } 
        : {}),
    ...(resolvedProductIds ? { shopifyProductId: { $in: resolvedProductIds } } : {}),
  };

  return {
    productMatch,
    variantMatch: variantConditions.length ? { $and: mergeConditions(variantConditions) } : undefined,
    inventoryMatch: inventoryConditions.length ? { $and: mergeConditions(inventoryConditions) } : undefined,
    resolvedProductIds,
  };
}