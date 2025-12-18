// controllers/metafields.controller.ts
import { Types } from "mongoose";
import MetafieldKeyIndex from "../models/MetafieldKeyIndex.js";

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

export async function searchMetafieldKeys(req: any, res: any) {
  const shopId = new Types.ObjectId(req.shopId);
  const ownerType = String(req.query.ownerType || "PRODUCT").toUpperCase();
  const type = req.query.type ? String(req.query.type) : null;
  const q = String(req.query.q || "").trim().toLowerCase();
  const limit = Math.min(parseInt(String(req.query.limit || "20"), 10), 50);
  const cursor = decodeCursor(req.query.cursor);

  const base: any = { shopId, ownerType };
  if (type) base.type = type;

  if (q) {
    // Search on namespace/key (prefix on either side is ok; keep it predictable)
    // For best performance, prefer prefix searches:
    //   ns:custom or key:color patterns (optional enhancement)
    base.$or = [
      { namespace: { $regex: `^${escapeRegex(q)}`, $options: "i" } },
      { key: { $regex: `^${escapeRegex(q)}`, $options: "i" } },
    ];
  }

  // Cursor on (count desc, namespace asc, key asc, type asc)
  // Cursor shape: { count, namespace, key, type }
  let cursorMatch: any = {};
  if (cursor?.count != null && cursor?.namespace && cursor?.key && cursor?.type) {
    cursorMatch = {
      $or: [
        { count: { $lt: cursor.count } },
        { count: cursor.count, namespace: { $gt: cursor.namespace } },
        { count: cursor.count, namespace: cursor.namespace, key: { $gt: cursor.key } },
        { count: cursor.count, namespace: cursor.namespace, key: cursor.key, type: { $gt: cursor.type } },
      ],
    };
  }

  const docs = await MetafieldKeyIndex.find({ ...base, ...(Object.keys(cursorMatch).length ? cursorMatch : {}) })
    .select("namespace key type count")
    .sort({ count: -1, namespace: 1, key: 1, type: 1 })
    .limit(limit)
    .lean();

  const last = docs[docs.length - 1];
  const nextCursor = last
    ? encodeCursor({ count: last.count, namespace: last.namespace, key: last.key, type: last.type })
    : null;

  res.json({
    items: docs.map((d) => ({
      namespace: d.namespace,
      key: d.key,
      type: d.type,
      label: `${d.namespace}.${d.key} (${d.type})`,
      count: d.count,
    })),
    pageInfo: { nextCursor, hasNext: docs.length === limit },
  });
}
