// services/productSync.js
import { productSyncQueue } from "../queues/productSync.queue.js";
import { getShopIdByDomain } from "../utils/shopHelpers.js"; // You'll need this helper

export async function syncAllProducts(req, res, next) {
  const session = res.locals.shopify?.session;
  const shop = session?.shop;
  const accessToken = session?.accessToken;

  if (!shop || !accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ✅ Get shopId from database
  try {
    const shopId = await getShopIdByDomain(shop);

    await productSyncQueue.add(
      "initial-product-sync",
      { 
        shop, 
        accessToken,
        shopId: shopId.toString() // ✅ Pass shopId as string
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    console.log(`📥 Product sync job added to queue for shop: ${shop}`);
    next();
  } catch (error) {
    console.error("❌ Failed to add sync job:", error);
    return res.status(500).json({ error: "Failed to start sync" });
  }
}