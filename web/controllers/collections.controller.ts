// controllers/collections.controller.ts
import { Types } from "mongoose";
import { Collection } from "../models/index.js";

function encodeCursor(obj: any) {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");
}
function decodeCursor(cursor?: string) {
  if (!cursor) return null;
  return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
}

export async function searchCollections(req: any, res: any) {
  const shopId = new Types.ObjectId(req.shopId);
  const q = String(req.query.q || "").trim();
  const limit = Math.min(parseInt(String(req.query.limit || "20"), 10), 50);
  const cursor = decodeCursor(req.query.cursor);
  const direction = (req.query.direction || "next") as "next" | "prev";

  // Base match (tenant + optional query)
  const baseMatch: any = { shopId };

  if (q) {
    // Index-friendly enough if you have {shopId, title} and {shopId, handle} indexes.
    // For truly massive collection counts, consider a dedicated search index strategy.
    baseMatch.$or = [
      { title: { $regex: escapeRegex(q), $options: "i" } },
      { handle: { $regex: escapeRegex(q), $options: "i" } },
    ];
  }

  // Cursor paging on (title, shopifyCollectionId) to avoid skip
  const sort =
    direction === "next"
      ? { title: 1, shopifyCollectionId: 1 }
      : { title: -1, shopifyCollectionId: -1 };

  let cursorMatch: any = {};
  if (cursor?.title && cursor?.shopifyCollectionId) {
    const op = direction === "next" ? "$gt" : "$lt";
    cursorMatch = {
      $or: [
        { title: { [op]: cursor.title } },
        { title: cursor.title, shopifyCollectionId: { [op]: cursor.shopifyCollectionId } },
      ],
    };
  }

  const docs = await Collection.find({
    ...baseMatch,
    ...(Object.keys(cursorMatch).length ? cursorMatch : {}),
  })
    .select("shopifyCollectionId title handle type")
    .sort(sort)
    .limit(limit)
    .lean();

  const first = docs[0];
  const last = docs[docs.length - 1];

  const nextCursor = last
    ? encodeCursor({ title: last.title, shopifyCollectionId: last.shopifyCollectionId })
    : null;

  const prevCursor = first
    ? encodeCursor({ title: first.title, shopifyCollectionId: first.shopifyCollectionId })
    : null;

  res.json({
    items: docs.map((d) => ({
      id: d.shopifyCollectionId,
      title: d.title,
      handle: d.handle,
      type: d.type,
    })),
    pageInfo: {
      nextCursor,
      prevCursor,
      hasNext: docs.length === limit,
      hasPrev: Boolean(cursor),
    },
  });
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
