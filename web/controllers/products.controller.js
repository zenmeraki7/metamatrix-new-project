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
  const shopId = new Types.ObjectId(req.shopId);
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);

  const mode = req.query.mode || "random";
  const direction = req.query.direction || "next";

  const cursor = decodeCursor(req.query.cursor);
  const filtersDsl = req.query.filters
    ? JSON.parse(req.query.filters)
    : null;

  // ✅ Compile filters
  const compiled = filtersDsl
    ? await compileFilter({ shopId, filter: filtersDsl })
    : { productMatch: { shopId } };

  const baseMatch = compiled.productMatch || { shopId };

  let sort = {};
  let cursorMatch = {};

  /* ---------------- RANDOM ---------------- */
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
      // ✅ DO NOT SKIP FIRST PAGE
      cursorMatch = {};
    }
  }

  /* ---------------- QUERY ---------------- */
  const query = {
    ...baseMatch,
    ...(Object.keys(cursorMatch).length ? cursorMatch : {}),
  };

  let items = await Product.find(query)
    .select(pickProductFields())
    .sort(sort)
    .limit(limit)
    .lean();

  /* ---------------- RANDOM WRAP ---------------- */
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

  /* ---------------- CURSORS ---------------- */
  const first = items[0];
  const last = items[items.length - 1];

  const nextCursor = last
    ? encodeCursor({
        rand: last.rand,
        shopifyProductId: last.shopifyProductId,
      })
    : null;

  const prevCursor = first
    ? encodeCursor({
        rand: first.rand,
        shopifyProductId: first.shopifyProductId,
      })
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
