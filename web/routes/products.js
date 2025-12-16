// web/routes/products.js
import express from "express";
import shopify from "../shopify.js"; //
import { shopifyGraphQL } from "../services/shopify/graphqlClient.js";
import { productsCache } from "../services/cache/lru.js";
import { PRODUCTS_QUERY } from "../services/shopify/products/products.query.js";

const router = express.Router();
const PAGE_SIZE = 50; // ✅ JS-safe

router.get(
  "/",
  shopify.validateAuthenticatedSession(),
  async (req, res) => {
    const { shop, accessToken, scopes } = res.locals.shopify;


  if (!shop || !accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!scopes?.includes("read_products")) {
    return res.status(403).json({ error: "Insufficient scope" });
  }

  if ("filters" in req.query) {
    return res
      .status(400)
      .json({ error: "Filters not allowed on browse endpoint" });
  }

  const direction = req.query.direction ?? "next";
  const cursor =
    typeof req.query.cursor === "string"
      ? req.query.cursor
      : null;

  const isPrev = direction === "prev";

  const variables = {
    first: isPrev ? null : PAGE_SIZE,
    last: isPrev ? PAGE_SIZE : null,
    after: !isPrev ? cursor : null,
    before: isPrev ? cursor : null,
  };

  const cacheKey = `${shop}:products:${direction}:${cursor ?? "first"}`;
  const cached = productsCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await shopifyGraphQL({
      ctx: {
        jobId: "browse:products",
        shop,
        accessToken,
        maxRetries: 2,
      },
      query: PRODUCTS_QUERY,
      variables,
    });

    const edges = data.products.edges;
    const normalizedEdges = isPrev ? [...edges].reverse() : edges;

    const response = {
      products: normalizedEdges.map(e => ({
        ...e.node,
        cursor: e.cursor,
      })),
      pageInfo: data.products.pageInfo,
    };

    productsCache.set(cacheKey, response);
    return res.json(response);
  } catch (err) {
    return res.status(502).json({
      error: "SHOPIFY_UNAVAILABLE",
    });
  }
});

export default router;
