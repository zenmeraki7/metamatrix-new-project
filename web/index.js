// @ts-check
import 'dotenv/config';      
import mongoose from 'mongoose';
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";
import productsRouter from "./routes/products.js";
import productWebhookRoutes from "./routes/webhooks.products.js";
import { syncAllProducts } from './services/productSync.js';


mongoose.set("bufferCommands", false);
mongoose.set("strictQuery", true);

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
  syncAllProducts,
  shopify.redirectToShopifyOrAppRoot()

);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);


// Parse JSON before any routes
app.use(express.json());


app.use("/webhooks", productWebhookRoutes);


// ✅ APPLY AUTH MIDDLEWARE FIRST - protects all /api routes
app.use("/api", shopify.validateAuthenticatedSession());

// ✅ THEN mount your routes - they'll be protected by the above middleware
app.use("/api/products", productsRouter);
console.log("Products router mounted at /api/products");

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

async function startServer() {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/shopifyDB";

    await mongoose.connect(MONGO_URI); // <-- no strictQuery, bufferCommands, or old options

    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`✅ Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server!!!:", err);
    process.exit(1);
  }
}

startServer();

