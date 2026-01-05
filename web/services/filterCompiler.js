// web/services/filterCompiler.js
import { dslConditionToCanonical } from "./dslToCanonical.js";
import { canonicalToMongo } from "./canonicalToMongo.js";

/**
 * UI DSL field  ->  MongoDB field
 * This is the SINGLE source of truth for field mapping
 */
const FIELD_MAP = {
  // ───────────── Product fields ─────────────
  "product.status": "status",
  "product.title": "title",
  "product.vendor": "vendor",
  "product.handle": "handle",
  "product.description": "description",
  "product.productType": "productType",
  "product.tags": "tags",
  "product.themeTemplate": "themeTemplate",
  "product.collectionId": "collectionIds",
  "product.productCategory": "productCategory",

  // ───────────── Date fields ─────────────
   "product.createdAt": "createdAt",
  "product.updatedAt": "updatedAt",
  "product.publishedAt": "publishedAt",
  // ───────────── Variant fields ─────────────
  "variant.sku": "variants.sku",
  "variant.barcode": "variants.barcode",
  "variant.price": "variants.price",
  "variant.optionOne": "variants.optionOne",

  // ───────────── Inventory (future-safe) ─────────────
  "inventory.available": "inventory.available",
};

/**
 * Normalize UI DSL field to Mongo field
 */
function normalizeField(field) {
  return FIELD_MAP[field] ?? field;
}

/**
 * Compile a single DSL condition into Mongo fragment
 */
export function compileOperator(condition) {
  if (!condition || !condition.op || !condition.field) return null;

  const normalizedField = normalizeField(condition.field);

  const normalizedCondition = {
    ...condition,
    field: normalizedField,
  };

  const canonical = dslConditionToCanonical(normalizedCondition);
  if (!canonical?.op) return null;

  const mongo = canonicalToMongo(canonical);
  if (!mongo) return null;

  return {
    field: normalizedField, // 🔑 single source of truth
    mongo: canonical.negate ? { $nor: [mongo] } : mongo,
  };
}


/**
 * Split conditions into product / variant / inventory buckets
 */
function splitConditions(node, product = [], variant = [], inventory = []) {
  if (!node) return;

const compiled = compileOperator(node.condition);
if (!compiled) return;

const { field, mongo } = compiled;

if (field.startsWith("variants.")) {
  variant.push(mongo);
} else if (field.startsWith("inventory.")) {
  inventory.push(mongo);
} else {
  product.push(mongo);
}


  if (node.and) {
    node.and.forEach((n) =>
      splitConditions(n, product, variant, inventory)
    );
  }

  if (node.or) {
    const p = [];
    const v = [];
    const i = [];

    node.or.forEach((n) => splitConditions(n, p, v, i));

    if (p.length) product.push({ $or: p });
    if (v.length) variant.push({ $or: v });
    if (i.length) inventory.push({ $or: i });
  }
}

/**
 * Main function
 * Compiles DSL filter into Mongo-compatible filters
 */
export async function compileFilter({ filter }) {
  const productConditions = [];
  const variantConditions = [];
  const inventoryConditions = [];

  splitConditions(filter, productConditions, variantConditions, inventoryConditions);

  const productMatch =
    productConditions.length === 1
      ? productConditions[0]
      : productConditions.length
      ? { $and: productConditions }
      : {};

  return {
    productMatch,
    variantMatch: variantConditions,
    inventoryMatch: inventoryConditions,
  };
}
