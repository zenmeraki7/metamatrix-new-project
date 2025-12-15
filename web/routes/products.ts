// web/routes/products.ts
import express, { Request, Response } from "express";
import { shopifyGraphQL } from "../services/shopify/graphqlClient";
import { productsCache } from "../services/cache/lru";
import { PRODUCTS_QUERY } from "./products.query";
import type { ProductSummary } from "../types/product";

const router = express.Router();
const PAGE_SIZE = 50 as const;

type Direction = "next" | "prev";

interface ProductsQueryVars {
  first?: number | null;
  last?: number | null;
  after?: string | null;
  before?: string | null;
}

interface ProductsQueryResponse {
  products: {
    edges: {
      cursor: string;
      node: ProductSummary;
    }[];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
  };
}

router.get("/", async (req: Request, res: Response) => {
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

  const direction =
    (req.query.direction as Direction) ?? "next";
  const cursor =
    typeof req.query.cursor === "string"
      ? req.query.cursor
      : null;

  const isPrev = direction === "prev";

  const variables: ProductsQueryVars = {
    first: isPrev ? null : PAGE_SIZE,
    last: isPrev ? PAGE_SIZE : null,
    after: !isPrev ? cursor : null,
    before: isPrev ? cursor : null,
  };

  const cacheKey = `${shop}:products:${direction}:${cursor ?? "first"}`;
  const cached = productsCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await shopifyGraphQL<
      ProductsQueryResponse,
      ProductsQueryVars
    >({
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

    const normalizedEdges = isPrev
      ? [...edges].reverse()
      : edges;

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
