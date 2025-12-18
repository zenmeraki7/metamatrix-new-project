// models/RollbackLink.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const RollbackLinkSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    sourceJobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    rollbackJobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },

    mode: { type: String, enum: ["full", "partial"], default: "full" },
    filters: {
      resourceIds: { type: [String], default: [] },
      fields: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

RollbackLinkSchema.index({ shopId: 1, sourceJobId: 1, rollbackJobId: 1 }, { unique: true });

export default getModel("RollbackLink", RollbackLinkSchema);
