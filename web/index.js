// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api", shopify.validateAuthenticatedSession());

app.use(express.json());
app.get("/api/products", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const client = new shopify.api.clients.Graphql({
      session,
    });

    const {
      cursor,
      direction = "next",
      limit = "20",
      search,
    } = req.query;

    const isNext = direction === "next";

    const query = `
      query Products(
        $first: Int
        $last: Int
        $after: String
        $before: String
        $query: String
      ) {
        products(
          first: $first
          last: $last
          after: $after
          before: $before
          query: $query
        ) {
          edges {
            cursor
            node {
              id
              title
              vendor
              status
              featuredImage {
                url
            altText
                }
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
      }
    `;

    
    const response = await client.request(query, {
      variables: {
        first: 50, // fetch only the first 50 products
        query: search ? `title:*${search}*` : undefined,
      },
    });

    const edges = response.data.products.edges;

    res.status(200).json({
      products: edges.map(({ node, cursor }) => ({
        id: node.id,
        title: node.title,
        handle: node.handle,
        vendor: node.vendor,
        status: node.status,
        image: node.featuredImage?.url,
        cursor,
      })),
      pageInfo: {
        hasNextPage:
          response.data.products.pageInfo.hasNextPage,
        hasPreviousPage:
          response.data.products.pageInfo.hasPreviousPage,
        startCursor:
          edges.length > 0 ? edges[0].cursor : null,
        endCursor:
          edges.length > 0
            ? edges[edges.length - 1].cursor
            : null,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: "Failed to fetch products",
    });
  }
});

app.get("/api/products/count", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

  res.status(200).send({ count: countData.data.productsCount.count });
});

app.post("/api/products", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT);
