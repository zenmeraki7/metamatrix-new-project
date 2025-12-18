// models/TagIndex.ts
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const TagIndexSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    tag: { type: String, required: true, trim: true, index: true },     // normalized lowercase
    display: { type: String, required: true, trim: true },              // original casing (first seen)
    count: { type: Number, default: 0, index: true },
    updatedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

TagIndexSchema.index({ shopId: 1, tag: 1 }, { unique: true });
TagIndexSchema.index({ shopId: 1, tag: 1, count: -1 });

export default getModel("TagIndex", TagIndexSchema);
