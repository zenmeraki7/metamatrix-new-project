// services/filterCompiler.js (DROP-IN SAFE VERSION)
// Key changes:
// 1) NO distinct() on Variant / Inventory hot paths
// 2) Aggregation + hard limits
// 3) Early exits for impossible filters
// 4) Safer metafield resolution

import { Types } from "mongoose";
import { Product, Variant, InventoryLevel, Metafield } from "../models/index.js";

/* ============================
 * Constants / Safety limits
 * ============================ */

const MAX_PRODUCT_IDS = 5000;   // hard cap to prevent memory blowups
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
  // gte + lte with same value => eq
  if (Array.isArray(value) && value.length === 2 && value[0] === value[1]) {
    return { op: "eq", value: value[0] };
  }
  return { op, value };
}

function compileOperator(field, op, value) {
  const norm = normalizeRange(op, value);
  op = norm.op;
  value = norm.value;

  switch (op) {
    case "eq": return { [field]: value };
    case "neq": return { [field]: { $ne: value } };
    case "gt": return { [field]: { $gt: value } };
    case "gte": return { [field]: { $gte: value } };
    case "lt": return { [field]: { $lt: value } };
    case "lte": return { [field]: { $lte: value } };
    case "between": return { [field]: { $gte: value[0], $lte: value[1] } };
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
 * Metafields (SAFE)
 * ============================ */

async function resolveMetafieldToProductIds(cond) {
  const { owner, namespace, key, type } = cond.meta;

  const base = {  ownerType: owner, namespace, key };
  if (type) base.type = type;

  // Step 1: get ownerIds safely (capped)
  const rows = await Metafield.aggregate([
    { $match: base },
    { $group: { _id: "$ownerId" } },
    { $limit: MAX_VARIANT_IDS }
  ]);

  const ownerIds = rows.map(r => r._id);
  if (!ownerIds.length) return [];

  // Step 2: map to products if needed
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
 * Main entry
 * ============================ */

export async function compileFilter({ shopId, filter }) {
  const productConditions = [];
  const variantConditions = [];
  const inventoryConditions = [];

  splitConditions(filter, productConditions, variantConditions, inventoryConditions);

  let resolvedProductIds;

  // Inventory → Variant narrowing (SAFE)
  if (inventoryConditions.length) {
    const invRows = await InventoryLevel.aggregate([
      { $match: {  $and: inventoryConditions } },
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
    const rows = await Variant.aggregate([
      { $match: {  $and: variantConditions } },
      { $group: { _id: "$shopifyProductId" } },
      { $limit: MAX_PRODUCT_IDS }
    ]);

    resolvedProductIds = rows.map(r => r._id);

    if (!resolvedProductIds.length) {
      return { productMatch: { _id: { $exists: false } } };
    }
  }

  const productMatch = {
  
    ...(productConditions.length ? { $and: productConditions } : {}),
    ...(resolvedProductIds ? { shopifyProductId: { $in: resolvedProductIds } } : {}),
  };

  return {
    productMatch,
    variantMatch: variantConditions.length ? { $and: variantConditions } : undefined,
    inventoryMatch: inventoryConditions.length ? { $and: inventoryConditions } : undefined,
    resolvedProductIds,
  };
}
