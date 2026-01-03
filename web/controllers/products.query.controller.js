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
    const shopId = req.shopId;
    const limit = Math.min(Number(req.body?.limit || 50), 100);
    const direction = req.body?.direction === "prev" ? "prev" : "next";
    const cursor = typeof req.body?.cursor === "string" ? req.body.cursor : null;
    const filterDsl = req.body?.filter || null;

    console.log(
  "\n[API] Incoming filter DSL:",
  JSON.stringify(req.body?.filter, null, 2)
);


    // ✅ ALWAYS start with shopId
    let baseQuery = { shopId };

    if (filterDsl) {
      const compiled = await compileFilter({
        shopId,
        filter: filterDsl,
      });

      // ✅ Merge compiled filters with shopId
      baseQuery = { 
        shopId,
        ...compiled.productMatch 
      };
    }

    // 🔍 DEBUGGING: Check what's actually in the database
    console.log("\n=== DEBUG INFO ===");

    // Add RIGHT AFTER the "=== DEBUG INFO ===" section in queryProducts

const collectionDebug = await Product.aggregate([
  { $match: { shopId } },
  { $project: { 
    hasCollections: { $gt: [{ $size: { $ifNull: ["$collections", []] } }, 0] },
    collectionsCount: { $size: { $ifNull: ["$collections", []] } },
    collections: 1,
    title: 1
  }},
  { $group: {
    _id: "$hasCollections",
    count: { $sum: 1 },
    sample: { $first: "$$ROOT" }
  }}
]);

console.log("9. Collection field analysis:", JSON.stringify(collectionDebug, null, 2));

    console.log("1. Base query:", JSON.stringify(baseQuery, null, 2));
    
    // ✅ All debug queries should include shopId
    const totalProducts = await Product.countDocuments({ shopId });
    console.log("2. Total products in shop:", totalProducts);
    
    const noFilterCount = await Product.countDocuments({ shopId });
    console.log("3. Products without filter:", noFilterCount);
    
    const hasInventoryField = await Product.countDocuments({ 
      shopId,
      totalInventory: { $exists: true }
    });
    console.log("4. Products with totalInventory field:", hasInventoryField);
    
    const inventoryDistribution = await Product.aggregate([
      { $match: { shopId } }, // ✅ Add shopId here
      { $group: { 
        _id: "$totalInventory",
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } },
      { $limit: 10 }
    ]);
    console.log("5. Inventory distribution (first 10):", inventoryDistribution);
    
    const nullInventory = await Product.countDocuments({ 
      shopId, // ✅ Add shopId here
      $or: [
        { totalInventory: null },
        { totalInventory: { $exists: false } }
      ]
    });
    console.log("6. Products with null/missing totalInventory:", nullInventory);
    
    const testMatch = await Product.countDocuments(baseQuery);
    console.log("7. Products matching your query:", testMatch);
    
    const sampleProducts = await Product.find({ shopId }) // ✅ Add shopId here
      .select({ shopifyProductId: 1, title: 1, status: 1, totalInventory: 1 })
      .limit(3)
      .lean();
    console.log("8. Sample products:", JSON.stringify(sampleProducts, null, 2));
    console.log("=== END DEBUG ===\n");

    // Rest of your pagination code...
    const decoded = decodeCursor(cursor);
    const lastId = decoded?.lastId ? String(decoded.lastId) : null;

    const sortDir = direction === "next" ? 1 : -1;
    const pageQuery = { ...baseQuery };

    if (lastId) {
      pageQuery[SORT_FIELD] =
        direction === "next" ? { $gt: lastId } : { $lt: lastId };
    }

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
    });
  } catch (err) {
    console.error("❌ Product query failed:", err);
    res.status(500).json({ error: "Product query failed", details: err.message });
  }
}