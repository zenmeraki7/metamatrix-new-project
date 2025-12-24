// controllers/webhooks.controller.js
import { Types } from "mongoose";
import { Product } from "../models/index.js";
import { getShopIdByDomain } from "../utils/shopHelpers.js";

export async function handleProductWebhook(req, res) {
  try {
    const payload = req.body;
    const shop = req.get("X-Shopify-Shop-Domain"); // ✅ Get shop from header

    if (!shop) {
      console.error("❌ No shop domain in webhook");
      return res.status(400).send("Missing shop domain");
    }

    // ✅ Get shopId from shop domain
    const shopId = await getShopIdByDomain(shop);

    const shopifyId = String(payload.id);

    const productData = {
      shopId, // ✅ Include shopId
      shopifyProductId: shopifyId,
      handle: payload.handle || "",
      title: payload.title || "",
      description: payload.body_html || "",
      vendor: payload.vendor || "",
      status: payload.status?.toUpperCase() || "DRAFT",
      productType: payload.product_type || "",
      tags: payload.tags ? payload.tags.split(", ") : [],
      totalInventory: payload.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0,
      createdAt: payload.created_at ? new Date(payload.created_at) : new Date(),
      updatedAt: payload.updated_at ? new Date(payload.updated_at) : new Date(),
      publishedAt: payload.published_at ? new Date(payload.published_at) : null,
      featuredMedia: payload.image
        ? {
            url: payload.image.src,
            id: String(payload.image.id || ""),
            alt: payload.image.alt || "",
          }
        : null,
      variants: payload.variants?.map((v) => ({
        shopifyVariantId: String(v.id),
        sku: v.sku || "",
        barcode: v.barcode || "",
        price: v.price ? parseFloat(v.price) : 0,
        inventoryQuantity: v.inventory_quantity ?? 0,
      })) || [],
      syncedAt: new Date(),
    };

    await Product.findOneAndUpdate(
      { shopId, shopifyProductId: shopifyId }, // ✅ Filter by both
      { $set: productData },
      { upsert: true, new: true }
    );

    console.log(`✅ Webhook processed: ${payload.title}`);
    res.status(200).send("Webhook processed");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).send("Error processing webhook");
  }
}