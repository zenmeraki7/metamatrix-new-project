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
  "product.collectionId": "collections",
  "product.productCategory": "productCategory",

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
  if (!condition || !condition.op || !condition.field) return {};

    console.log("🔍 COMPILE:", {
    original: condition.field,
    normalized: normalizeField(condition.field),
    operator: condition.op,
    value: condition.value
  });


  // 🔑 Normalize field BEFORE canonical conversion
  const normalizedCondition = {
    ...condition,
    field: normalizeField(condition.field),
  };

  const canonical = dslConditionToCanonical(normalizedCondition);
  if (!canonical?.op) return {};

  const mongo = canonicalToMongo(canonical);
  if (!mongo) return {};

  return canonical.negate ? { $nor: [mongo] } : mongo;
}

/**
 * Split conditions into product / variant / inventory buckets
 */
function splitConditions(node, product = [], variant = [], inventory = []) {
  if (!node) return;

  if (node.condition) {
    const mongoFragment = compileOperator(node.condition);
    const field = normalizeField(node.condition.field);

    if (field.startsWith("variants.")) {
      variant.push(mongoFragment);
    } else if (field.startsWith("inventory.")) {
      inventory.push(mongoFragment);
    } else {
      product.push(mongoFragment);
    }
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
