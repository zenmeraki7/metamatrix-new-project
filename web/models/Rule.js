// models/Rule.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const RuleSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },

    name: { type: String, required: true, trim: true, index: true },
    description: { type: String },

    target: { type: String, enum: ["PRODUCT", "VARIANT", "INVENTORY", "COLLECTION"], required: true, index: true },
    status: { type: String, enum: ["active", "paused", "archived"], default: "active", index: true },

    triggerMode: { type: String, enum: ["manual", "scheduled", "event", "hybrid"], default: "manual" },

    latestVersionId: { type: mongoose.Schema.Types.ObjectId, ref: "RuleVersion" },

    createdBy: {
      userId: { type: String, trim: true },
      email: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

RuleSchema.index({ shopId: 1, status: 1 });
RuleSchema.index({ shopId: 1, target: 1 });

export default getModel("Rule", RuleSchema);
