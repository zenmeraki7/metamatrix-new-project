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
  const shopIdRaw = req.shopId;
  const shopId = Types.ObjectId.isValid(shopIdRaw) ? new Types.ObjectId(shopIdRaw) : shopIdRaw;

  const rawLimit = parseInt(req.query.limit ?? "50", 10);
  const limit = Math.max(1, Math.min(Number.isFinite(rawLimit) ? rawLimit : 50, 100));

  const mode = req.query.mode || "random";
  const direction = req.query.direction || "next";

  const cursor = decodeCursor(req.query.cursor);
  const cursorRand = cursor && typeof cursor.rand === "number" ? cursor.rand : null;
  const cursorPid = cursor && typeof cursor.shopifyProductId === "string" ? cursor.shopifyProductId : null;

  let filtersDsl = null;
  if (req.query.filters) {
    try {
      filtersDsl = JSON.parse(req.query.filters);
    } catch {
      return res.status(400).json({ error: "Invalid filters JSON" });
    }
  }

  const compiled = filtersDsl
    ? await compileFilter({ shopId, filter: filtersDsl })
    : { productMatch: { shopId } };

  // force shop scope regardless of compiler correctness
  const baseMatch = compiled.productMatch ? { $and: [{ shopId }, compiled.productMatch] } : { shopId };

  let sort = {};
  let cursorMatch = null;

  if (mode === "random") {
    const op = direction === "next" ? "$gt" : "$lt";
    sort = direction === "next"
      ? { rand: 1, shopifyProductId: 1 }
      : { rand: -1, shopifyProductId: -1 };

    if (cursorRand != null && cursorPid) {
      cursorMatch = {
        $or: [
          { rand: { [op]: cursorRand } },
          { rand: cursorRand, shopifyProductId: { [op]: cursorPid } },
        ],
      };
    }
  }

  const query = cursorMatch ? { $and: [baseMatch, cursorMatch] } : baseMatch;

  // correct hasNext
  let docs = await Product.find(query)
    .select(pickProductFields())
    .sort(sort)
    .limit(limit + 1)
    .lean();

  const hasNext = docs.length > limit;
  let items = hasNext ? docs.slice(0, limit) : docs;

  // random wrap (optional) - keep but make safe
  if (mode === "random" && !cursor && items.length < limit) {
    const remaining = limit - items.length;
    const anchorRand = items.length ? items[0].rand : null;

    const wrapMatch = anchorRand == null
      ? baseMatch
      : { $and: [baseMatch, { rand: { $lt: anchorRand } }] };

    const wrap = await Product.find(wrapMatch)
      .select(pickProductFields())
      .sort({ rand: 1, shopifyProductId: 1 })
      .limit(remaining)
      .lean();

    items = items.concat(wrap);
  }

  const first = items[0];
  const last = items[items.length - 1];

  res.json({
    items,
    pageInfo: {
      hasNext,
      hasPrev: Boolean(cursor),
      nextCursor: last ? encodeCursor({ rand: last.rand, shopifyProductId: last.shopifyProductId }) : null,
      prevCursor: first ? encodeCursor({ rand: first.rand, shopifyProductId: first.shopifyProductId }) : null,
    },
  });
}
