// models/Schedule.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const ScheduleSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },

    type: { type: String, enum: ["cron", "interval"], required: true },
    cron: { type: String, trim: true },
    intervalSeconds: { type: Number, min: 60 },

    timezone: { type: String, required: true, default: "UTC" },

    ruleId: { type: mongoose.Schema.Types.ObjectId, ref: "Rule" },
    ruleVersionId: { type: mongoose.Schema.Types.ObjectId, ref: "RuleVersion" }, // pin if you want deterministic schedules

    enabled: { type: Boolean, default: true, index: true },

    nextRunAt: { type: Date, required: true, index: true },
    lastRunAt: { type: Date },

    createdBy: { email: { type: String, trim: true } },
  },
  { timestamps: true }
);

ScheduleSchema.index({ shopId: 1, enabled: 1, nextRunAt: 1 });

export default getModel("Schedule", ScheduleSchema);
