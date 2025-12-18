// controllers/tags.controller.ts
import { Types } from "mongoose";
import TagIndex from "../models/TagIndex.js";

function encodeCursor(obj: any) {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");
}
function decodeCursor(cursor?: string) {
  if (!cursor) return null;
  return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
}
function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function searchTags(req: any, res: any) {
  const shopId = new Types.ObjectId(req.shopId);
  const q = String(req.query.q || "").trim().toLowerCase();
  const limit = Math.min(parseInt(String(req.query.limit || "20"), 10), 50);
  const cursor = decodeCursor(req.query.cursor);

  const base: any = { shopId };
  if (q) base.tag = { $regex: `^${escapeRegex(q)}` }; // prefix search

  // Cursor on (count desc, tag asc) with a stable tie-breaker
  // Cursor shape: { count, tag }
  let cursorMatch: any = {};
  if (cursor?.count != null && cursor?.tag) {
    cursorMatch = {
      $or: [
        { count: { $lt: cursor.count } },
        { count: cursor.count, tag: { $gt: cursor.tag } },
      ],
    };
  }

  const docs = await TagIndex.find({ ...base, ...(Object.keys(cursorMatch).length ? cursorMatch : {}) })
    .select("tag display count")
    .sort({ count: -1, tag: 1 })
    .limit(limit)
    .lean();

  const last = docs[docs.length - 1];
  const nextCursor = last ? encodeCursor({ count: last.count, tag: last.tag }) : null;

  res.json({
    items: docs.map((d) => ({ value: d.display, label: d.display, count: d.count })),
    pageInfo: { nextCursor, hasNext: docs.length === limit },
  });
}
