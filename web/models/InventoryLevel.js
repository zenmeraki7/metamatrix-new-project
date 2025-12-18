// models/InventoryLevel.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const InventoryLevelSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    inventoryItemId: { type: String, required: true, trim: true, index: true },
    locationId: { type: String, required: true, trim: true, index: true },

    available: { type: Number, required: true, index: true },

    updatedAtShopify: { type: Date },
    syncedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

InventoryLevelSchema.index(
  { shopId: 1, inventoryItemId: 1, locationId: 1 },
  { unique: true }
);

export default getModel("InventoryLevel", InventoryLevelSchema);
