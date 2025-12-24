// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    shopId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      index: true
    },
    shopifyProductId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    handle: String,
    description: String,
    status: { type: String, enum: ["ACTIVE", "DRAFT", "ARCHIVED"], default: "DRAFT" },
    vendor: String,
    productType: String,
    tags: [String],
    totalInventory: { type: Number, default: 0 },
    featuredMedia: {
      url: String,
      id: String,
      alt: String,
    },
    variants: [
      {
        shopifyVariantId: String,
        sku: String,
        barcode: String,
        price: Number,
        inventoryQuantity: Number,
      },
    ],
    createdAt: Date,
    updatedAt: Date,
    publishedAt: Date,
    syncedAt: Date,
  },
  { timestamps: true }
);

productSchema.index({ shopId: 1, shopifyProductId: 1 }, { unique: true });

// ✅ Use default export
export default mongoose.model("Product", productSchema);