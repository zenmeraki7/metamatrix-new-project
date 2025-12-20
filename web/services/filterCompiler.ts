// services/filterCompiler.ts
import { Types } from "mongoose";
import { Product, Variant, InventoryLevel } from "../models/index.js";

/**
 * ============================
 * Types
 * ============================
 */

export type LogicalOp = "and" | "or" | "not";

export type Operator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "regex"
  | "exists"
  | "not_exists"
  | "in"
  | "not_in";

export interface Condition {
  field: string; // e.g. "product.vendor", "variant.price", "inventory.available"
  op: Operator;
  value?: any;
}

export interface FilterNode {
  and?: FilterNode[];
  or?: FilterNode[];
  not?: FilterNode;
  condition?: Condition;
}

export interface CompiledFilter {
  productMatch: any;
  variantMatch?: any;
  inventoryMatch?: any;
  resolvedProductIds?: string[];
}

/**
 * ============================
 * Field maps
 * ============================
 */

const PRODUCT_FIELD_MAP: Record<string, string> = {
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

const VARIANT_FIELD_MAP: Record<string, string> = {
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

const INVENTORY_FIELD_MAP: Record<string, string> = {
  "inventory.available": "available",
};

/**
 * ============================
 * Operator compilation
 * ============================
 */

function compileOperator(field: string, op: Operator, value: any) {
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
      return { [field]: { $gte: value[0], $lte: value[1] } };
    case "contains":
      return { [field]: { $regex: value, $options: "i" } };
    case "not_contains":
      return { [field]: { $not: { $regex: value, $options: "i" } } };
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
      return { [field]: { $in: value } };
    case "not_in":
      return { [field]: { $nin: value } };
    default:
      throw new Error(`Unsupported operator: ${op}`);
  }
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * ============================
 * DSL → Mongo compiler
 * ============================
 */

function splitConditions(
  node: FilterNode,
  product: any[],
  variant: any[],
  inventory: any[]
) {
  if (node.condition) {
    const { field, op, value } = node.condition;

    if (field in PRODUCT_FIELD_MAP) {
      product.push(compileOperator(PRODUCT_FIELD_MAP[field], op, value));
    } else if (field in VARIANT_FIELD_MAP) {
      variant.push(compileOperator(VARIANT_FIELD_MAP[field], op, value));
    } else if (field in INVENTORY_FIELD_MAP) {
      inventory.push(compileOperator(INVENTORY_FIELD_MAP[field], op, value));
    } else {
      throw new Error(`Unknown filter field: ${field}`);
    }
  }

  if (node.and) {
    node.and.forEach((child) =>
      splitConditions(child, product, variant, inventory)
    );
  }

  if (node.or) {
    const orProduct: any[] = [];
    const orVariant: any[] = [];
    const orInventory: any[] = [];

    node.or.forEach((child) =>
      splitConditions(child, orProduct, orVariant, orInventory)
    );

    if (orProduct.length) product.push({ $or: orProduct });
    if (orVariant.length) variant.push({ $or: orVariant });
    if (orInventory.length) inventory.push({ $or: orInventory });
  }

  if (node.not) {
    const notProduct: any[] = [];
    const notVariant: any[] = [];
    const notInventory: any[] = [];

    splitConditions(node.not, notProduct, notVariant, notInventory);

    if (notProduct.length) product.push({ $nor: notProduct });
    if (notVariant.length) variant.push({ $nor: notVariant });
    if (notInventory.length) inventory.push({ $nor: notInventory });
  }
}

/**
 * ============================
 * Main compiler entry
 * ============================
 */

export async function compileFilter({
  shopId,
  filter,
}: {
  shopId: Types.ObjectId;
  filter: FilterNode | null;
}): Promise<CompiledFilter> {

  // ✅ SAFETY GUARD (prevents backend crash)
  if (!filter || (!filter.and && !filter.or && !filter.not)) {
    return {
      productMatch: {  },
    };
  }

  const productConditions: any[] = [];
  const variantConditions: any[] = [];
  const inventoryConditions: any[] = [];

  splitConditions(filter, productConditions, variantConditions, inventoryConditions);

  let resolvedProductIds: string[] | undefined;

  // Inventory → Variant
  if (inventoryConditions.length) {
    const inventoryItemIds = await InventoryLevel.distinct(
      "inventoryItemId",
      {  $and: inventoryConditions }
    );

    if (!inventoryItemIds.length) {
      return { productMatch: { _id: { $exists: false } } };
    }

    variantConditions.push({
      inventoryItemId: { $in: inventoryItemIds },
    });
  }

  // Variant → Product
  if (variantConditions.length) {
    resolvedProductIds = await Variant.distinct("shopifyProductId", {
    
      $and: variantConditions,
    });

    if (!resolvedProductIds.length) {
      return { productMatch: { _id: { $exists: false } } };
    }
  }

  const productMatch: any = {
    
    ...(productConditions.length ? { $and: productConditions } : {}),
  };

  if (resolvedProductIds) {
    productMatch.shopifyProductId = { $in: resolvedProductIds };
  }

  return {
    productMatch,
  };
}

