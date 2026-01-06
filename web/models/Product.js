import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    shopifyProductId: {
      type: String,
      required: true,
      index: true,
    },

    title: { type: String, required: true },
    handle: String,
    description: String,

    // ✅ Canonical collection storage (GIDs only)
    collectionIds: {
      type: [String],
      index: true,
      default: [],
      validate: {
        validator: (arr) =>
          Array.isArray(arr) &&
          arr.every(
            (v) =>
              typeof v === "string" &&
              v.startsWith("gid://shopify/Collection/")
          ),
        message: "collectionIds must contain Shopify Collection GIDs",
      },
    },

    status: {
      type: String,
      enum: ["ACTIVE", "DRAFT", "ARCHIVED"],
      default: "DRAFT",
    },

    vendor: String,
    productType: String,

    tags: {
      type: [String],
      default: [],
    },

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

    publishedAt: Date,
    syncedAt: Date,
  },
  { timestamps: true }
);

/* -------------------- INDEXES -------------------- */

// Unique per shop
productSchema.index(
  { shopId: 1, shopifyProductId: 1 },
  { unique: true }
);

// ✅ REQUIRED for collection filtering
productSchema.index({ shopId: 1, collectionIds: 1 });

// (Optional but recommended as filters grow)
productSchema.index({ shopId: 1, status: 1 });
productSchema.index({ shopId: 1, vendor: 1 });
productSchema.index({ shopId: 1, productType: 1 });
productSchema.index({ shopId: 1, tags: 1 });

export default mongoose.model("Product", productSchema);
