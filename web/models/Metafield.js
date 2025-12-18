// models/Metafield.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const MetafieldSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },

    ownerType: { type: String, enum: ["PRODUCT", "VARIANT", "COLLECTION"], required: true, index: true },
    ownerId: { type: String, required: true, trim: true, index: true },

    namespace: { type: String, required: true, trim: true, index: true },
    key: { type: String, required: true, trim: true, index: true },

    type: { type: String, required: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    valueHash: { type: String, required: true, trim: true, index: true },

    syncedAt: { type: Date, default: Date.now, index: true },
    shopifyUpdatedAt: { type: Date, index: true },
  },
  { timestamps: true }
);

MetafieldSchema.index(
  { shopId: 1, ownerType: 1, ownerId: 1, namespace: 1, key: 1 },
  { unique: true }
);

export default getModel("Metafield", MetafieldSchema);
