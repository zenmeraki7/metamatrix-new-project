// models/Collection.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const CollectionSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    shopifyCollectionId: { type: String, required: true, trim: true },

    type: { type: String, enum: ["SMART", "CUSTOM"], required: true, index: true },

    handle: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, index: true },

    descriptionHtml: { type: String },

    seo: {
      title: { type: String },
      description: { type: String },
    },

    rules: { type: mongoose.Schema.Types.Mixed },

    syncedAt: { type: Date, default: Date.now, index: true },
    shopifyUpdatedAt: { type: Date, index: true },
  },
  { timestamps: true }
);

CollectionSchema.index({ shopId: 1, shopifyCollectionId: 1 }, { unique: true });

export default getModel("Collection", CollectionSchema);
