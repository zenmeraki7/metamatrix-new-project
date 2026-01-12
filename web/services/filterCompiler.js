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

  console.log("🔍 [compileOperator] Input:", JSON.stringify(normalizedCondition, null, 2));

  const canonical = dslConditionToCanonical(normalizedCondition);
  console.log("🔍 [compileOperator] Canonical:", JSON.stringify(canonical, null, 2));

  if (!canonical?.op) return null;

  const mongo = canonicalToMongo(canonical);
  console.log("🔍 [compileOperator] Mongo:", JSON.stringify(mongo, null, 2));

  if (!mongo) return null;

  return {
    field: normalizedField,
    mongo: canonical.negate ? { $nor: [mongo] } : mongo,
  };
}

/**
 * Split conditions into product / variant / inventory buckets
 * 🔧 FIX: Properly pass and accumulate arrays through recursion
 */
function splitConditions(node, product = [], variant = [], inventory = []) {
  if (!node) return { product, variant, inventory };

  // ✅ Compile if this node has a condition
  if (node.condition) {
    const compiled = compileOperator(node.condition);

    if (compiled) {
      console.log(
        "[splitConditions] compiled:",
        JSON.stringify(compiled, null, 2)
      );

      const { field, mongo } = compiled;

      if (field.startsWith("variants.")) {
        variant.push(mongo);
      } else if (field.startsWith("inventory.")) {
        inventory.push(mongo);
      } else {
        product.push(mongo);
      }
    }
  }

  // ✅ FIXED: Pass the SAME arrays through recursion
  if (node.and) {
    node.and.forEach((n) =>
      splitConditions(n, product, variant, inventory)
    );
  }

  if (node.or) {
    // For OR, we need to collect conditions separately
    const orProduct = [];
    const orVariant = [];
    const orInventory = [];

    node.or.forEach((n) => 
      splitConditions(n, orProduct, orVariant, orInventory)
    );

    if (orProduct.length) product.push({ $or: orProduct });
    if (orVariant.length) variant.push({ $or: orVariant });
    if (orInventory.length) inventory.push({ $or: orInventory });
  }

  return { product, variant, inventory };
}

/**
 * Main function
 * Compiles DSL filter into Mongo-compatible filters
 */
export async function compileFilter({ filter }) {
  const productConditions = [];
  const variantConditions = [];
  const inventoryConditions = [];

  // 🔧 FIX: Use the returned arrays
  splitConditions(filter, productConditions, variantConditions, inventoryConditions);

  const productMatch =
    productConditions.length === 1
      ? productConditions[0]
      : productConditions.length
      ? { $and: productConditions }
      : {};

  console.log("[compileFilter] Final productMatch:", JSON.stringify(productMatch, null, 2));

  return {
    productMatch,
    variantMatch: variantConditions,
    inventoryMatch: inventoryConditions,
  };
}