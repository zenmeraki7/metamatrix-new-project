import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const CollectionSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    shopifyCollectionId: {
      type: String, // GID
      required: true,
      index: true,
        validate: {
    validator: (v) => typeof v === "string" && v.startsWith("gid://shopify/Collection/"),
    message: "shopifyCollectionId must be a Collection GID",
  },
    },

    title: { type: String, required: true },
    handle: { type: String },

    type: {
      type: String,
      enum: ["SMART", "CUSTOM"],
      required: true,
    },
  },
  { timestamps: true }
);

CollectionSchema.index({ shopId: 1, title: 1, shopifyCollectionId: 1 }, { unique: true });


export default getModel("Collection", CollectionSchema);
