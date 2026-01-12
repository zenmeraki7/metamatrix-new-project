// controllers/syncproduct.controller.js
import { productSyncQueue } from "../queues/productSync.queue.js";
import { Shop } from "../models/index.js";

export async function syncAllProducts(req, res, next) {
  const session = res.locals.shopify?.session;
  const shop = session?.shop;
  const accessToken = session?.accessToken;

  if (!shop || !accessToken) {
    console.error("❌ Missing session data");
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ✅ FIX: Use shopDomain instead of shop
  const shopDoc = await Shop.findOne({ shopDomain: shop });

  if (!shopDoc) {
    console.error("❌ Shop not found in DB:", shop);
    return res.status(404).json({ error: "Shop not found in DB" });
  }

  console.log("✅ Found shop:", shopDoc._id);

  const job = await productSyncQueue.add(
    "initial-product-sync",
    {
      shop,
      accessToken,
      shopId: shopDoc._id.toString(),
    },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  console.log("📥 Product sync job added:", job.id);

  return res.json({
    success: true,
    jobId: job.id,
  });
}