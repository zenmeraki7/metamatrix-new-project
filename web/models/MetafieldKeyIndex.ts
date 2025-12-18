// models/MetafieldKeyIndex.ts
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const MetafieldKeyIndexSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    ownerType: { type: String, enum: ["PRODUCT", "VARIANT", "COLLECTION"], required: true, index: true },
    namespace: { type: String, required: true, trim: true, index: true },
    key: { type: String, required: true, trim: true, index: true },
    type: { type: String, required: true, trim: true, index: true }, // Shopify metafield type
    count: { type: Number, default: 0, index: true },
    updatedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

MetafieldKeyIndexSchema.index(
  { shopId: 1, ownerType: 1, namespace: 1, key: 1, type: 1 },
  { unique: true }
);

MetafieldKeyIndexSchema.index({ shopId: 1, ownerType: 1, namespace: 1, key: 1, count: -1 });

export default getModel("MetafieldKeyIndex", MetafieldKeyIndexSchema);
