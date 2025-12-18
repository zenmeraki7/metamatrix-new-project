import mongoose from "mongoose";
import { getModel, lowerTrim } from "./_utils.js";

const ProductSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    // ✅ REQUIRED for random pagination
    rand: {
      type: Number,
      required: true,
      index: true,
    },

    shopifyProductId: { type: String, required: true, trim: true },

    handle: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: ["ACTIVE", "DRAFT", "ARCHIVED"],
      required: true,
      index: true,
    },

    vendor: { type: String, trim: true, index: true },
    productType: { type: String, trim: true, index: true },

    tags: {
      type: [String],
      default: [],
      set: (arr) =>
        Array.isArray(arr)
          ? arr.map(lowerTrim).filter(Boolean)
          : [],
      index: true,
    },

    featuredMedia: {
      id: String,
      url: String,
      alt: String,
    },

    totalInventory: { type: Number, index: true },

    collectionIds: { type: [String], default: [], index: true },

    syncedAt: { type: Date, default: Date.now },
    shopifyUpdatedAt: { type: Date },
  },
  { timestamps: true }
);

// ✅ IMPORTANT indexes
ProductSchema.index({ shopId: 1, shopifyProductId: 1 }, { unique: true });
ProductSchema.index({ shopId: 1, rand: 1, shopifyProductId: 1 });

export default getModel("Product", ProductSchema);
