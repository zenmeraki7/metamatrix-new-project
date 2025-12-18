// models/Variant.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const VariantSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },

    shopifyVariantId: { type: String, required: true, trim: true },
    shopifyProductId: { type: String, required: true, trim: true, index: true },

    title: { type: String, trim: true },

    sku: { type: String, trim: true, index: true },
    barcode: { type: String, trim: true, index: true },

    price: { type: Number, required: true, index: true },
    compareAtPrice: { type: Number, index: true },
    cost: { type: Number },

    weight: { type: Number },
    weightUnit: { type: String, trim: true },

    inventoryItemId: { type: String, trim: true, index: true },
    inventoryPolicy: { type: String, enum: ["CONTINUE", "DENY"] },
    inventoryTracked: { type: Boolean, default: true },

    requiresShipping: { type: Boolean },
    taxable: { type: Boolean },
    position: { type: Number },

    selectedOptions: [
      {
        name: { type: String, trim: true },
        value: { type: String, trim: true },
      },
    ],

    metafieldRefs: { type: [String], default: [] },

    syncedAt: { type: Date, default: Date.now, index: true },
    shopifyUpdatedAt: { type: Date, index: true },
  },
  { timestamps: true }
);

VariantSchema.index({ shopId: 1, shopifyVariantId: 1 }, { unique: true });
VariantSchema.index({ shopId: 1, shopifyProductId: 1 });

export default getModel("Variant", VariantSchema);
