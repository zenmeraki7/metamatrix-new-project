// services/filterCompiler.js
import { Types } from "mongoose";
import { Product, Variant, InventoryLevel, Metafield } from "../models/index.js";

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
 * Operator compilation
 * ============================ */

function escapeRegex(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compileOperator(field, op, value) {
  switch (op) {
    case "eq":
      return { [field]: value };
    case "neq":
      return { [field]: { $ne: value } };
    case "gt":
      return { [field]: { $gt: value } };
    case "gte":
      return { [field]: { $gte: value } };
    case "lt":
      return { [field]: { $lt: value } };
    case "lte":
      return { [field]: { $lte: value } };
    case "between":
      if (!Array.isArray(value) || value.length !== 2) {
        throw new Error(`between expects [min,max] for ${field}`);
      }
      return { [field]: { $gte: value[0], $lte: value[1] } };
    case "contains":
      return { [field]: { $regex: escapeRegex(value), $options: "i" } };
    case "not_contains":
      return { [field]: { $not: { $regex: escapeRegex(value), $options: "i" } } };
    case "starts_with":
      return { [field]: { $regex: `^${escapeRegex(value)}`, $options: "i" } };
    case "ends_with":
      return { [field]: { $regex: `${escapeRegex(value)}$`, $options: "i" } };
    case "regex":
      return { [field]: { $regex: value } };
    case "exists":
      return { [field]: { $exists: true } };
    case "not_exists":
      return { [field]: { $exists: false } };
    case "in":
      if (!Array.isArray(value)) throw new Error(`in expects array for ${field}`);
      return { [field]: { $in: value } };
    case "not_in":
      if (!Array.isArray(value)) throw new Error(`not_in expects array for ${field}`);
      return { [field]: { $nin: value } };
    default:
      throw new Error(`Unsupported operator: ${op}`);
  }
}

/* ============================
 * Metafield helpers
 * ============================ */

function isMetaCondition(cond) {
  return cond.field === "metafield";
}

function normalizeMetaValueByType(type, value) {
  if (value === undefined) return value;
  const t = (type || "").toLowerCase();

  if (t.includes("number_integer")) return parseInt(value, 10);
  if (t.includes("number_decimal")) return parseFloat(value);

  if (t.includes("boolean")) {
    if (typeof value === "boolean") return value;
    const s = String(value).toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }

  return value;
}

function buildMetafieldValueClause(type, op, value) {
  const normalized = normalizeMetaValueByType(type, value);

  if (op === "exists" || op === "not_exists") return null;

  const textOps = ["contains", "not_contains", "starts_with", "ends_with", "regex"];

  if (textOps.includes(op)) {
    if (op === "regex") return { value: { $regex: normalized } };
    if (op === "contains") return { value: { $regex: escapeRegex(normalized), $options: "i" } };
    if (op === "not_contains")
      return { value: { $not: { $regex: escapeRegex(normalized), $options: "i" } } };
    if (op === "starts_with")
      return { value: { $regex: `^${escapeRegex(normalized)}`, $options: "i" } };
    if (op === "ends_with")
      return { value: { $regex: `${escapeRegex(normalized)}$`, $options: "i" } };
  }

  switch (op) {
    case "eq":
      return { value: normalized };
    case "neq":
      return { value: { $ne: normalized } };
    case "gt":
      return { value: { $gt: normalized } };
    case "gte":
      return { value: { $gte: normalized } };
    case "lt":
      return { value: { $lt: normalized } };
    case "lte":
      return { value: { $lte: normalized } };
    case "between":
      return { value: { $gte: normalized[0], $lte: normalized[1] } };
    case "in":
      return { value: { $in: normalized } };
    case "not_in":
      return { value: { $nin: normalized } };
    default:
      throw new Error(`Unsupported metafield operator: ${op}`);
  }
}

function metaCacheKey(c) {
  const m = c.meta;
  return [
    m.owner,
    m.namespace,
    m.key,
    m.type || "",
    c.op,
    JSON.stringify(c.value ?? null),
  ].join("|");
}

/* ============================
 * Metafield resolution
 * ============================ */

async function resolveMetafieldToProductIds(shopId, cond) {
  const { owner, namespace, key, type } = cond.meta;

  const base = { shopId, ownerType: owner, namespace, key };
  if (type) base.type = type;

  if (cond.op === "exists") {
    if (owner === "PRODUCT") {
      return Metafield.distinct("ownerId", base);
    }
    if (owner === "VARIANT") {
      const variantIds = await Metafield.distinct("ownerId", base);
      return Variant.distinct("shopifyProductId", {
        shopId,
        shopifyVariantId: { $in: variantIds },
      });
    }
    return [];
  }

  if (cond.op === "not_exists") {
    const haveIds = await Metafield.distinct("ownerId", base);
    return haveIds.map((id) => `NIN:${id}`);
  }

  const valueClause = buildMetafieldValueClause(type, cond.op, cond.value);
  const query = valueClause ? { ...base, ...valueClause } : base;

  if (owner === "PRODUCT") {
    return Metafield.distinct("ownerId", query);
  }

  if (owner === "VARIANT") {
    const variantIds = await Metafield.distinct("ownerId", query);
    return Variant.distinct("shopifyProductId", {
      shopId,
      shopifyVariantId: { $in: variantIds },
    });
  }

  return [];
}

async function resolveMetaPlaceholders(shopId, expr, cache) {
  if (!expr || typeof expr !== "object") return expr;

  if (expr.__meta) {
    const key = metaCacheKey(expr.__meta);
    if (cache.has(key)) return cache.get(key);

    const ids = await resolveMetafieldToProductIds(shopId, expr.__meta);
    const nin = ids.filter((x) => String(x).startsWith("NIN:")).map((x) => x.slice(4));
    const normal = ids.filter((x) => !String(x).startsWith("NIN:"));

    const clause =
      expr.__meta.op === "not_exists"
        ? { shopifyProductId: { $nin: nin } }
        : { shopifyProductId: { $in: normal } };

    cache.set(key, clause);
    return clause;
  }

  if (Array.isArray(expr)) {
    return Promise.all(expr.map((e) => resolveMetaPlaceholders(shopId, e, cache)));
  }

  const out = {};
  for (const [k, v] of Object.entries(expr)) {
    out[k] = await resolveMetaPlaceholders(shopId, v, cache);
  }
  return out;
}

/* ============================
 * DSL splitter
 * ============================ */

function splitConditions(node, product, variant, inventory) {
  if (node.condition) {
    const c = node.condition;

    if (isMetaCondition(c)) {
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

  node.and?.forEach((n) => splitConditions(n, product, variant, inventory));

  if (node.or) {
    const p = [], v = [], i = [];
    node.or.forEach((n) => splitConditions(n, p, v, i));
    if (p.length) product.push({ $or: p });
    if (v.length) variant.push({ $or: v });
    if (i.length) inventory.push({ $or: i });
  }

  if (node.not) {
    const p = [], v = [], i = [];
    splitConditions(node.not, p, v, i);
    if (p.length) product.push({ $nor: p });
    if (v.length) variant.push({ $nor: v });
    if (i.length) inventory.push({ $nor: i });
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

  const metaCache = new Map();
  const resolvedProductConditions = await resolveMetaPlaceholders(
    shopId,
    productConditions,
    metaCache
  );

  let resolvedProductIds;

  if (inventoryConditions.length) {
    const inventoryIds = await InventoryLevel.distinct("inventoryItemId", {
      shopId,
      $and: inventoryConditions,
    });

    if (!inventoryIds.length) {
      return { productMatch: { _id: { $exists: false } } };
    }

    variantConditions.push({ inventoryItemId: { $in: inventoryIds } });
  }

  if (variantConditions.length) {
    resolvedProductIds = await Variant.distinct("shopifyProductId", {
      shopId,
      $and: variantConditions,
    });

    if (!resolvedProductIds.length) {
      return { productMatch: { _id: { $exists: false } } };
    }
  }

  const productMatch = {
    shopId,
    ...(resolvedProductConditions.length ? { $and: resolvedProductConditions } : {}),
    ...(resolvedProductIds ? { shopifyProductId: { $in: resolvedProductIds } } : {}),
  };

  return {
    productMatch,
    variantMatch: variantConditions.length ? { shopId, $and: variantConditions } : undefined,
    inventoryMatch: inventoryConditions.length ? { shopId, $and: inventoryConditions } : undefined,
    resolvedProductIds,
  };
}
