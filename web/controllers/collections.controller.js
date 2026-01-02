import { Collection, Shop } from "../models/index.js";


/* ---------------------------------- */
/* Cursor helpers                      */
/* ---------------------------------- */

function encodeCursor(obj) {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");
}

function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ---------------------------------- */
/* Search collections                 */
/* ---------------------------------- */

export async function searchCollections(req, res) {
  try {
    const session = res.locals.shopify?.session;
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // const shopId = session.shopId;
const shopDomain = session.shop; // demo-zen-store.myshopify.com

const shopDoc = await Shop.findOne({ shopDomain })
  .select("_id")
  .lean();

if (!shopDoc) {
  return res.status(404).json({ error: "Shop not found" });
}

const match = { shopId: shopDoc._id };

    const q = String(req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 50);
    const cursor = decodeCursor(req.query.cursor);

    // const match = { shopId };

    if (q) {
      match.$or = [
        { title: { $regex: escapeRegex(q), $options: "i" } },
        { handle: { $regex: escapeRegex(q), $options: "i" } },
      ];
    }

    if (cursor?.title && cursor?.shopifyCollectionId) {
      match.$and = [
        {
          $or: [
            { title: { $gt: cursor.title } },
            {
              title: cursor.title,
              shopifyCollectionId: { $gt: cursor.shopifyCollectionId },
            },
          ],
        },
      ];
    }

    const docs = await Collection.find(match)
      .select("shopifyCollectionId title handle type")
      .sort({ title: 1, shopifyCollectionId: 1 })
      .limit(limit + 1)
      .lean();

      console.log("Collections returned:", docs.length);


    const hasNext = docs.length > limit;
    const items = hasNext ? docs.slice(0, limit) : docs;
    const last = items[items.length - 1];

    res.json({
      items: items.map((d) => ({
        id: d.shopifyCollectionId,
        title: d.title,
        handle: d.handle,
        type: d.type,
      })),
      pageInfo: {
        nextCursor: hasNext
          ? encodeCursor({
              title: last.title,
              shopifyCollectionId: last.shopifyCollectionId,
            })
          : null,
        hasNext,
      },
    });
  } catch (err) {
    console.error("searchCollections failed", err);
    res.status(500).json({ error: "Failed to search collections" });
  }
}
