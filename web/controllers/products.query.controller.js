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

     // 🔍 PROOF DEBUG — ADD THIS
    const sample = await Product.findOne({});
    console.log("🧪 SAMPLE PRODUCT shopId:", sample?.shopId?.toString());

    console.log(
      "🧪 REQ shopId:",
      shopId,
      "isValidObjectId:",
      Types.ObjectId.isValid(shopId),
      "asObjectId:",
      Types.ObjectId.isValid(shopId)
        ? new Types.ObjectId(shopId).toString()
        : "INVALID"
    );
    // 🔍 END PROOF DEBUG
    
    const limit = Math.min(Number(req.body?.limit || 50), 100);
    const direction = req.body?.direction === "prev" ? "prev" : "next";
    const cursor = typeof req.body?.cursor === "string" ? req.body.cursor : null;
    const filterDsl = req.body?.filter || null;

    console.log(
      "\n[API] Incoming filter DSL:",
      JSON.stringify(req.body?.filter, null, 2)
    );

    // ✅ ALWAYS start with shopId - convert to ObjectId if needed
    const mongoShopId = Types.ObjectId.isValid(shopId) 
      ? new Types.ObjectId(shopId) 
      : shopId;

    let baseQuery = { shopId: mongoShopId };

    if (filterDsl) {
      const compiled = await compileFilter({
        shopId: mongoShopId,
        filter: filterDsl,
      });

      // ✅ Merge compiled filters with shopId
      baseQuery = {
        shopId: mongoShopId,
        ...compiled.productMatch,
      };
    }

    // 🔍 DEBUGGING: Check what's actually in the database
    console.log("\n=== DEBUG INFO ===");

    const collectionDebug = await Product.aggregate([
      { $match: { shopId: mongoShopId } },
      {
        $project: {
          hasCollections: {
            $gt: [{ $size: { $ifNull: ["$collectionIds", []] } }, 0],
          },
          collectionsCount: { $size: { $ifNull: ["$collectionIds", []] } },
          collectionIds: 1,
          title: 1,
        },
      },
      {
        $group: {
          _id: "$hasCollections",
          count: { $sum: 1 },
          sample: { $first: "$$ROOT" },
        },
      },
    ]);

    console.log(
      "9. Collection field analysis:",
      JSON.stringify(collectionDebug, null, 2)
    );

    console.log("1. Base query:", JSON.stringify(baseQuery, null, 2));

    const totalProducts = await Product.countDocuments({ shopId: mongoShopId });
    console.log("2. Total products in shop:", totalProducts);

    const noFilterCount = await Product.countDocuments({ shopId: mongoShopId });
    console.log("3. Products without filter:", noFilterCount);

    const hasInventoryField = await Product.countDocuments({
      shopId: mongoShopId,
      totalInventory: { $exists: true },
    });
    console.log("4. Products with totalInventory field:", hasInventoryField);

    const inventoryDistribution = await Product.aggregate([
      { $match: { shopId: mongoShopId } },
      {
        $group: {
          _id: "$totalInventory",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 10 },
    ]);
    console.log("5. Inventory distribution (first 10):", inventoryDistribution);

    const nullInventory = await Product.countDocuments({
      shopId: mongoShopId,
      $or: [
        { totalInventory: null },
        { totalInventory: { $exists: false } },
      ],
    });
    console.log("6. Products with null/missing totalInventory:", nullInventory);

    const testMatch = await Product.countDocuments(baseQuery);
    console.log("7. Products matching your query:", testMatch);

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

    // ✅ FIXED: Match frontend expectations
    const endCursor =
      direction === "next" && hasExtra && last
        ? encodeCursor({ lastId: last[SORT_FIELD] })
        : null;

    const startCursor =
      direction === "prev" && hasExtra && first
        ? encodeCursor({ lastId: first[SORT_FIELD] })
        : null;

    const matchedCount = await Product.countDocuments(baseQuery);

    // ✅ FIXED: Return structure matching frontend expectations
    res.json({
      items: pageDocs,
      pageInfo: {
        hasNextPage: direction === "next" && hasExtra,  // ✅ Added
        hasPreviousPage: direction === "prev" && hasExtra,  // ✅ Added
        endCursor,  // ✅ Changed from nextCursor
        startCursor,  // ✅ Changed from prevCursor
      },
      matchedCount,
    });
  } catch (err) {
    console.error("❌ Product query failed:", err);
    res.status(500).json({
      error: "Product query failed",
      details: err.message,
    });
  }
}