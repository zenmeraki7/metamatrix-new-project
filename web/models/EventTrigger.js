// models/EventTrigger.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const EventTriggerSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },

    name: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: true, index: true },

    eventType: {
      type: String,
      enum: ["product_created", "product_updated", "inventory_changed", "collection_membership_changed"],
      required: true,
      index: true,
    },

    conditionsDsl: { type: mongoose.Schema.Types.Mixed, required: true },

    action: {
      type: { type: String, enum: ["run_rule", "notify", "run_job_template"], required: true },
      ruleId: { type: mongoose.Schema.Types.ObjectId, ref: "Rule" },
      ruleVersionId: { type: mongoose.Schema.Types.ObjectId, ref: "RuleVersion" },
      template: { type: mongoose.Schema.Types.Mixed },
    },

    cooldown: {
      windowSeconds: { type: Number, default: 60, min: 1 },
      maxRuns: { type: Number, default: 3, min: 1 },
    },

    lastFiredAt: { type: Date },
  },
  { timestamps: true }
);

EventTriggerSchema.index({ shopId: 1, enabled: 1, eventType: 1 });

export default getModel("EventTrigger", EventTriggerSchema);
