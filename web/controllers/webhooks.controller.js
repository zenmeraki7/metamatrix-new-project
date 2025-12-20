import { Product } from "../models/index.js";

/**
 * Handles product create/update from Shopify
 */

export async function handleProductWebhook(req, res) {
  try {
    const payload = req.body;

    // Extract fields you care about
    const productData = {
      shopifyProductId: payload.id,
      handle: payload.handle,
      title: payload.title,
      vendor: payload.vendor,
      status: payload.status,
      featuredMedia: payload.featuredImage
        ? {
            url: payload.featuredImage.url,
            id: payload.featuredImage.id || "",
            alt: payload.featuredImage.alt || "",
          }
        : {},
      syncedAt: new Date(),
    };

    // Upsert product into DB
    await Product.findOneAndUpdate(
      { shopifyProductId: payload.id },
      { $set: productData },
      { upsert: true, new: true }
    );

    res.status(200).send("Webhook processed");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Error processing webhook");
  }
}
