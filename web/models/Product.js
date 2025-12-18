// models/Product.js
import mongoose from "mongoose";
import { getModel, lowerTrim } from "./_utils.js";

const ProductSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    shopifyProductId: { type: String, required: true, trim: true },

    handle: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    status: { type: String, enum: ["ACTIVE", "DRAFT", "ARCHIVED"], required: true, index: true },

    vendor: { type: String, trim: true, index: true },
    productType: { type: String, trim: true, index: true },

    tags: {
      type: [String],
      default: [],
      set: (arr) => (Array.isArray(arr) ? arr.map(lowerTrim).filter(Boolean) : []),
      index: true,
    },

    descriptionHtml: { type: String },

    seo: {
      title: { type: String },
      description: { type: String },
    },

    featuredMedia: {
      id: { type: String, trim: true },
      url: { type: String, trim: true },
      alt: { type: String },
    },

    totalInventory: { type: Number, index: true },
    variantCount: { type: Number, default: 0 },

    options: [
      {
        name: { type: String, trim: true },
        values: { type: [String], default: [] },
      },
    ],

    collectionIds: { type: [String], default: [], index: true },

    metafieldRefs: { type: [String], default: [] },

    syncedAt: { type: Date, default: Date.now, index: true },
    shopifyUpdatedAt: { type: Date, index: true },
  },
  { timestamps: true }
);

ProductSchema.index({ shopId: 1, shopifyProductId: 1 }, { unique: true });
ProductSchema.index({ shopId: 1, vendor: 1 });
ProductSchema.index({ shopId: 1, productType: 1 });
ProductSchema.index({ shopId: 1, tags: 1 });
ProductSchema.index({ shopId: 1, collectionIds: 1 });
ProductSchema.index({ shopId: 1, handle: 1 });

export default getModel("Product", ProductSchema);
