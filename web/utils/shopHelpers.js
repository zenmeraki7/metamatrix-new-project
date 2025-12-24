// utils/shopHelpers.js
import mongoose from "mongoose";

// Assuming you have a Shop model - adjust if different
const shopSchema = new mongoose.Schema({
  shop: { type: String, required: true, unique: true },
  accessToken: String,
  // ... other fields
});

export const Shop = mongoose.models.Shop || mongoose.model("Shop", shopSchema);

export async function getShopIdByDomain(shopDomain) {
  const shop = await Shop.findOne({ shop: shopDomain }).select("_id");
  
  if (!shop) {
    throw new Error(`Shop not found: ${shopDomain}`);
  }
  
  return shop._id;
}