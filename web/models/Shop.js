// models/Shop.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const ShopSchema = new mongoose.Schema(
  {
    shopDomain: { type: String, required: true, unique: true, index: true, trim: true },
    shopifyShopId: { type: String, index: true, trim: true },

    // Store encrypted at rest (use KMS envelope or libsodium sealed boxes)
    accessToken: { type: String, required: true },

    scopes: { type: [String], default: [] },

    plan: {
      name: { type: String, default: "free" },
      status: { type: String, enum: ["active", "trial", "cancelled"], default: "trial" },
      expiresAt: { type: Date },
    },

    currency: { type: String, default: "USD" },
    ianaTimezone: { type: String, default: "UTC" },

    installedAt: { type: Date, default: Date.now },
    uninstalledAt: { type: Date },

    settings: {
      defaultLocationId: { type: String, trim: true },
      rollbackRetentionDays: { type: Number, default: 30, min: 1, max: 3650 },
      auditRetentionDays: { type: Number, default: 90, min: 1, max: 3650 },
      maxConcurrency: { type: Number, default: 6, min: 1, max: 50 },
      previewSampleSize: { type: Number, default: 200, min: 10, max: 5000 },
    },
  },
  { timestamps: true }
);

export default getModel("Shop", ShopSchema);
