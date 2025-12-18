// models/RuleVersion.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const RuleVersionSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    ruleId: { type: mongoose.Schema.Types.ObjectId, ref: "Rule", required: true, index: true },

    version: { type: Number, required: true },

    filterDsl: { type: mongoose.Schema.Types.Mixed, required: true },
    actionsDsl: { type: mongoose.Schema.Types.Mixed, required: true },

    compiled: {
      matchQuery: { type: mongoose.Schema.Types.Mixed, required: true }, // Mongo $match
      projection: { type: mongoose.Schema.Types.Mixed },
      estimatedCost: {
        avgCostPoints: { type: Number },
        avgMutations: { type: Number },
      },
    },

    checksum: { type: String, required: true, trim: true, index: true },
  },
  { timestamps: true }
);

RuleVersionSchema.index({ shopId: 1, ruleId: 1, version: 1 }, { unique: true });
RuleVersionSchema.index({ shopId: 1, ruleId: 1, createdAt: -1 });

export default getModel("RuleVersion", RuleVersionSchema);
