import { Shop } from "../models/index.js";

export async function ensureShopExists(req, res, next) {
  try {
    const session = res.locals.shopify.session;

    if (!session?.shop || !session?.accessToken) {
      throw new Error("Invalid Shopify session");
    }

    const shop = await Shop.findOneAndUpdate(
      // 🔑 MUST match schema field exactly
      { shopDomain: session.shop },

      {
        shopDomain: session.shop,
        accessToken: session.accessToken,
      },

      { upsert: true, new: true }
    );

    // 🔑 Attach Mongo shopId for all downstream logic
    session.shopId = shop._id;

    next();
  } catch (err) {
    console.error("ensureShopExists failed", err);
    res.status(500).send("Failed to initialize shop");
  }
}
