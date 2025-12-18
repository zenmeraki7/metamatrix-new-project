// controllers/products.controller.js
import { Types } from "mongoose";
import { Product } from "../models/index.js";
import { compileFilter } from "../services/filterCompiler.js";
import { encodeCursor, decodeCursor } from "../utils/cursor.js";

function pickProductFields() {
  return {
    shopifyProductId: 1,
    title: 1,
    status: 1,
    vendor: 1,
    productType: 1,
    totalInventory: 1,
    featuredMedia: 1,
    rand: 1,
    updatedAt: 1,
  };
}

export async function listProducts(req, res) {
  const shopId = new Types.ObjectId(req.shopId); // however you attach it
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);

  const mode = req.query.mode || "random"; // random | recent | title
  const direction = req.query.direction || "next"; // next | prev

  const cursor = decodeCursor(req.query.cursor);
  const filtersDsl = req.query.filters ? JSON.parse(req.query.filters) : null;

  // Compile filters
  const compiled = filtersDsl
    ? await compileFilter({ shopId, filter: filtersDsl })
    : { productMatch: { shopId } };

  const baseMatch = compiled.productMatch || { shopId };

  let sort;
  let cursorMatch = {};

  /* -----------------------------
   * RANDOM
   * --------------------------- */
  if (mode === "random") {
    sort =
      direction === "next"
        ? { rand: 1, shopifyProductId: 1 }
        : { rand: -1, shopifyProductId: -1 };

    if (cursor?.rand != null && cursor?.shopifyProductId) {
      const op = direction === "next" ? "$gt" : "$lt";
      cursorMatch = {
        $or: [
          { rand: { [op]: cursor.rand } },
          {
            rand: cursor.rand,
            shopifyProductId: { [op]: cursor.shopifyProductId },
          },
        ],
      };
    } else {
      // first page random pivot
      const pivot = Math.random();
      cursorMatch = { rand: { $gte: pivot } };
    }
  }

  /* -----------------------------
   * RECENT
   * --------------------------- */
  if (mode === "recent") {
    sort =
      direction === "next"
        ? { updatedAt: -1, shopifyProductId: 1 }
        : { updatedAt: 1, shopifyProductId: -1 };

    if (cursor?.updatedAt && cursor?.shopifyProductId) {
      const op = direction === "next" ? "$lt" : "$gt";
      cursorMatch = {
        $or: [
          { updatedAt: { [op]: new Date(cursor.updatedAt) } },
          {
            updatedAt: new Date(cursor.updatedAt),
            shopifyProductId: {
              [direction === "next" ? "$gt" : "$lt"]:
                cursor.shopifyProductId,
            },
          },
        ],
      };
    }
  }

  /* -----------------------------
   * TITLE
   * --------------------------- */
  if (mode === "title") {
    sort =
      direction === "next"
        ? { title: 1, shopifyProductId: 1 }
        : { title: -1, shopifyProductId: -1 };

    if (cursor?.title && cursor?.shopifyProductId) {
      const op = direction === "next" ? "$gt" : "$lt";
      cursorMatch = {
        $or: [
          { title: { [op]: cursor.title } },
          {
            title: cursor.title,
            shopifyProductId: { [op]: cursor.shopifyProductId },
          },
        ],
      };
    }
  }

  /* -----------------------------
   * QUERY
   * --------------------------- */
  let items = [];

  if (compiled.productPipeline) {
    const pipeline = [
      ...compiled.productPipeline,
      { $match: cursorMatch },
      { $sort: sort },
      { $limit: limit },
      { $project: pickProductFields() },
    ];

    items = await Product.aggregate(pipeline).option({
      allowDiskUse: true,
    });
  } else {
    const query = {
      ...baseMatch,
      ...(Object.keys(cursorMatch).length ? cursorMatch : {}),
    };

    items = await Product.find(query)
      .select(pickProductFields())
      .sort(sort)
      .limit(limit)
      .lean();
  }

  /* -----------------------------
   * RANDOM WRAP-AROUND
   * --------------------------- */
  if (mode === "random" && !cursor && items.length < limit) {
    const remaining = limit - items.length;

    const wrap = await Product.find({
      ...baseMatch,
      rand: { $lt: items[0]?.rand ?? 1 },
    })
      .select(pickProductFields())
      .sort({ rand: 1, shopifyProductId: 1 })
      .limit(remaining)
      .lean();

    items = items.concat(wrap);
  }

  /* -----------------------------
   * CURSORS
   * --------------------------- */
  const first = items[0];
  const last = items[items.length - 1];

  const nextCursor = last
    ? encodeCursor(
        mode === "random"
          ? { rand: last.rand, shopifyProductId: last.shopifyProductId }
          : mode === "recent"
          ? { updatedAt: last.updatedAt, shopifyProductId: last.shopifyProductId }
          : { title: last.title, shopifyProductId: last.shopifyProductId }
      )
    : null;

  const prevCursor = first
    ? encodeCursor(
        mode === "random"
          ? { rand: first.rand, shopifyProductId: first.shopifyProductId }
          : mode === "recent"
          ? {
              updatedAt: first.updatedAt,
              shopifyProductId: first.shopifyProductId,
            }
          : { title: first.title, shopifyProductId: first.shopifyProductId }
      )
    : null;

  res.json({
    items,
    pageInfo: {
      hasNext: items.length === limit,
      hasPrev: Boolean(cursor),
      nextCursor,
      prevCursor,
    },
  });
}
