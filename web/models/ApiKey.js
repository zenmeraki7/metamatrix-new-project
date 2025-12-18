// models/ApiKey.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const ApiKeySchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    name: { type: String, required: true, trim: true },

    keyHash: { type: String, required: true, trim: true, index: true }, // store hash only
    scopes: { type: [String], default: [] },

    lastUsedAt: { type: Date },
    revokedAt: { type: Date, index: true },
  },
  { timestamps: true }
);

ApiKeySchema.index({ shopId: 1, keyHash: 1 }, { unique: true });

export default getModel("ApiKey", ApiKeySchema);
