// models/SelectionSet.ts
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const SelectionSetSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    key: { type: String, required: true, trim: true, index: true }, // e.g. jobId or compiler hash
    shopifyProductId: { type: String, required: true, trim: true, index: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

SelectionSetSchema.index({ shopId: 1, key: 1, shopifyProductId: 1 }, { unique: true });

// TTL: fixed retention (e.g., 24 hours)
SelectionSetSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export default getModel("SelectionSet", SelectionSetSchema);
