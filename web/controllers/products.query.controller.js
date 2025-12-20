import crypto from "crypto";
import { Types } from "mongoose";
import Product from "../models/Product.js";
import { compileFilter } from "../services/filterCompiler.js";
import { encodeCursor, decodeCursor } from "../utils/cursor.js";

const SORT_FIELD = "shopifyProductId";

function pickFields() {
  return {
    shopifyProductId: 1,
    title: 1,
    status: 1,
    vendor: 1,
    productType: 1,
    totalInventory: 1,
    featuredMedia: 1,
  };
}

export async function queryProducts(req, res) {
  try {
    const shopId = new Types.ObjectId(req.shopId);
    const limit = Math.min(Number(req.body?.limit || 50), 100);
    const direction = req.body?.direction === "prev" ? "prev" : "next";
    const cursor = typeof req.body?.cursor === "string" ? req.body.cursor : null;
    const filterDsl = req.body?.filter || null;

    // ✅ SAFE FILTER COMPILATION
    let baseQuery = {  };

    if (filterDsl) {
      const compiled = await compileFilter({
        shopId,
        filter: filterDsl,
      });

      baseQuery = compiled.productMatch;
    }

    // Cursor handling
    const decoded = decodeCursor(cursor);
    const lastId = decoded?.lastId ? String(decoded.lastId) : null;

    const sortDir = direction === "next" ? 1 : -1;
    const pageQuery = { ...baseQuery };

    if (lastId) {
      pageQuery[SORT_FIELD] =
        direction === "next" ? { $gt: lastId } : { $lt: lastId };
    }
  console.log("pagequery!!!!",pageQuery);

    const docs = await Product.find(pageQuery)
      .select(pickFields())
      .sort({ [SORT_FIELD]: sortDir })
      .limit(limit + 1)
      .lean();

    const hasExtra = docs.length > limit;
    const pageDocs = hasExtra ? docs.slice(0, limit) : docs;

    const first = pageDocs[0];
    const last = pageDocs[pageDocs.length - 1];

    const nextCursor =
      direction === "next" && hasExtra && last
        ? encodeCursor({ lastId: last[SORT_FIELD] })
        : null;

    const prevCursor =
      direction === "prev" && hasExtra && first
        ? encodeCursor({ lastId: first[SORT_FIELD] })
        : null;

    const matchedCount = await Product.countDocuments(baseQuery);

    res.json({
      items: pageDocs,
      pageInfo: {
        nextCursor,
        prevCursor,
      },
      matchedCount,
      pageQuery
    });
  } catch (err) {
    console.error("❌ Product query failed:", err);
    res.status(500).json({ error: "Product query failed" });
  }
}
