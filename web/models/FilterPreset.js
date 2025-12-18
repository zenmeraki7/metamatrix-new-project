// models/FilterPreset.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const FilterPresetSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },

    name: { type: String, required: true, trim: true, index: true },
    target: { type: String, enum: ["PRODUCT", "VARIANT", "COLLECTION", "INVENTORY"], required: true, index: true },

    queryDsl: { type: mongoose.Schema.Types.Mixed, required: true }, // your filter AST
    uiState: { type: mongoose.Schema.Types.Mixed },

    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

FilterPresetSchema.index({ shopId: 1, target: 1 });
FilterPresetSchema.index({ shopId: 1, name: 1 });

export default getModel("FilterPreset", FilterPresetSchema);
