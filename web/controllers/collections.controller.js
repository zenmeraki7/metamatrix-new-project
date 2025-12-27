import { Collection } from "../models/index.js";

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
    // ✅ CORRECT Shopify auth source
    const session = res.locals.shopify?.session;
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // ✅ Use shop domain as tenant key
    const shop = session.shop; // e.g. my-store.myshopify.com

    const q = String(req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 50);
    const cursor = decodeCursor(req.query.cursor);

    /* ------------------------------- */
    /* Base match                      */
    /* ------------------------------- */

    const match = { shop };

    if (q) {
      match.$or = [
        { title: { $regex: escapeRegex(q), $options: "i" } },
        { handle: { $regex: escapeRegex(q), $options: "i" } },
      ];
    }

    /* ------------------------------- */
    /* Cursor pagination               */
    /* ------------------------------- */

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

    /* ------------------------------- */
    /* Query                           */
    /* ------------------------------- */

    const docs = await Collection.find(match)
      .select("shopifyCollectionId title handle type")
      .sort({ title: 1, shopifyCollectionId: 1 })
      .limit(limit + 1)
      .lean();

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
