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
    if (!session?.shop) return res.status(401).json({ error: "Unauthorized" });

    const shopDomain = session.shop;

    const shopDoc = await Shop.findOne({ shopDomain }).select("_id").lean();
    if (!shopDoc?._id) return res.status(404).json({ error: "Shop not found" });

    const q = String(req.query.q ?? "").trim();

    const rawLimit = parseInt(req.query.limit ?? "20", 10);
    const limit = Math.max(1, Math.min(Number.isFinite(rawLimit) ? rawLimit : 20, 50));

    const cursorRaw = decodeCursor(req.query.cursor);

    const cursorTitle =
      cursorRaw && typeof cursorRaw.title === "string" ? cursorRaw.title : null;
    const cursorId =
      cursorRaw && typeof cursorRaw.shopifyCollectionId === "string"
        ? cursorRaw.shopifyCollectionId
        : null;

    const match = { shopId: shopDoc._id };

    if (q) {
      match.$or = [
        { title: { $regex: escapeRegex(q), $options: "i" } },
        { handle: { $regex: escapeRegex(q), $options: "i" } },
      ];
    }

    if (cursorTitle && cursorId) {
      match.$and = match.$and || [];
      match.$and.push({
        $or: [
          { title: { $gt: cursorTitle } },
          { title: cursorTitle, shopifyCollectionId: { $gt: cursorId } },
        ],
      });
    }

    const docs = await Collection.find(match)
      .select("shopifyCollectionId title handle type")
      .sort({ title: 1, shopifyCollectionId: 1 })
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;
    const items = hasNext ? docs.slice(0, limit) : docs;

    const last = hasNext ? items[items.length - 1] : null;

    return res.json({
      items: items.map((d) => ({
        id: d.shopifyCollectionId,
        title: d.title,
        handle: d.handle,
        type: d.type,
      })),
      pageInfo: {
        nextCursor:
          hasNext && last
            ? encodeCursor({
                // optionally also include q for validation
                title: last.title,
                shopifyCollectionId: last.shopifyCollectionId,
              })
            : null,
        hasNext,
      },
    });
  } catch (err) {
    console.error("searchCollections failed", err);
    return res.status(500).json({ error: "Failed to search collections" });
  }
}
