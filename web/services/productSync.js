import { productSyncQueue } from "../queus/productSync.queue.js";

export async function syncAllProducts(req, res ,next) {
  const session = res.locals.shopify?.session;
  const shop = session?.shop;
  const accessToken = session?.accessToken;

  if (!shop || !accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await productSyncQueue.add(
    "initial-product-sync",
    { shop, accessToken },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  console.log("📥 Product sync job added to queue");

 next();
}
