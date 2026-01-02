import express from "express";
import shopify from "../shopify.js";

const router = express.Router();

router.get("/search", async (req, res) => {
  try {
    const session = res.locals.shopify.session;

    const q = req.query.q || "";
    const cursor = req.query.cursor || null;

    // 🔑 THIS IS THE IMPORTANT FIX
    const limitRaw = req.query.limit;
    const first = Number.isInteger(Number(limitRaw))
      ? Number(limitRaw)
      : 20; // fallback

    const client = new shopify.api.clients.Graphql({ session });

    const query = `
      query Collections($first: Int!, $after: String, $query: String) {
        collections(first: $first, after: $after, query: $query) {
          edges {
            cursor
            node {
              id
              title
              handle
              __typename
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `;

    const variables = {
      first,                 // ✅ ALWAYS Int
      after: cursor,
      query: q ? `title:*${q}*` : undefined,
    };

    const resp = await client.request(query, { variables });

    const edges = resp.data.collections.edges;

    res.json({
      items: edges.map(e => ({
        id: e.node.id,
        title: e.node.title,
        handle: e.node.handle,
        type: e.node.__typename === "SmartCollection" ? "SMART" : "CUSTOM",
      })),
      pageInfo: {
        nextCursor: edges.length ? edges[edges.length - 1].cursor : null,
        hasNext: resp.data.collections.pageInfo.hasNextPage,
      },
    });

  } catch (err) {
    console.error("❌ Failed to fetch collections:", err);
    res.status(500).json({ error: "Failed to fetch collections" });
  }
});

export default router;
