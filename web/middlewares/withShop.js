import Shop from "../models/Shop.js";

export async function withShop(req, res, next) {
  const session = res.locals.shopify?.session;

  if (!session?.shop) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  const shop = await Shop.findOne({ domain: session.shop });

  if (!shop) {
    return res.status(404).json({ error: "Shop not found" });
  }

  req.shopId = shop._id;
  next();
}

