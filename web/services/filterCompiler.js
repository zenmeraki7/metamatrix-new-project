// web/services/filterCompiler.js
import { dslConditionToCanonical } from "./dslToCanonical.js";
import { canonicalToMongo } from "./canonicalToMongo.js";
import { Product, Variant, InventoryLevel, Metafield } from "../models/index.js"; // adjust if needed

const MAX_PRODUCT_IDS = 5000;
const MAX_VARIANT_IDS = 10000;

export function compileOperator(condition) {
  if (!condition || !condition.op || !condition.field) return {};

  const canonical = dslConditionToCanonical(condition);
  if (!canonical?.op) return {};

  const mongo = canonicalToMongo(canonical);
  if (!mongo) return {};

  if (canonical.negate) return { $nor: [mongo] };
  return mongo;
}

function splitConditions(node, product = [], variant = [], inventory = []) {
  if (!node) return;

  if (node.condition) {
    const mongoFragment = compileOperator(node.condition);

    const field = node.condition.field;
    if (field.startsWith("product.")) product.push(mongoFragment);
    else if (field.startsWith("variant.")) variant.push(mongoFragment);
    else if (field.startsWith("inventory.")) inventory.push(mongoFragment);
    else product.push(mongoFragment);
  }

  if (node.and) node.and.forEach((n) => splitConditions(n, product, variant, inventory));
  if (node.or) {
    const p = [], v = [], i = [];
    node.or.forEach((n) => splitConditions(n, p, v, i));
    if (p.length) product.push({ $or: p });
    if (v.length) variant.push({ $or: v });
    if (i.length) inventory.push({ $or: i });
  }
}

// Main function to compile DSL into Mongo filter
export async function compileFilter({ filter }) {
  const productConditions = [];
  const variantConditions = [];
  const inventoryConditions = [];

  splitConditions(filter, productConditions, variantConditions, inventoryConditions);

  const productMatch =
    productConditions.length === 1
      ? productConditions[0]
      : { $and: productConditions.length ? productConditions : [] };

  return { productMatch, variantMatch: variantConditions, inventoryMatch: inventoryConditions };
}
