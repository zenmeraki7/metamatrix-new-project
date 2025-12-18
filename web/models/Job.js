// models/Job.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const JobSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },

    type: { type: String, enum: ["bulk_edit", "rule_run", "csv_import", "rollback", "collection_membership"], required: true, index: true },
    target: { type: String, enum: ["PRODUCT", "VARIANT", "INVENTORY", "COLLECTION"], required: true, index: true },

    source: {
      ruleId: { type: mongoose.Schema.Types.ObjectId, ref: "Rule" },
      ruleVersionId: { type: mongoose.Schema.Types.ObjectId, ref: "RuleVersion" },
      filterPresetId: { type: mongoose.Schema.Types.ObjectId, ref: "FilterPreset" },
      csvImportId: { type: mongoose.Schema.Types.ObjectId, ref: "CsvImport" },
      sourceJobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" }, // for rollback chaining
    },

    status: { type: String, enum: ["queued", "running", "paused", "succeeded", "failed", "cancelled"], default: "queued", index: true },
    priority: { type: Number, default: 0, index: true },

    // Must be unique per shop. Use stable hash of (target + selection + actions + user + timestamp bucket) where desired.
    idempotencyKey: { type: String, required: true, trim: true },

    summary: {
      selectedCount: { type: Number, default: 0 },
      changedCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
    },

    metrics: {
      startedAt: { type: Date },
      finishedAt: { type: Date },
      productsPerSecond: { type: Number },
      apiCalls: { type: Number },
      costPointsConsumed: { type: Number },
      retryCount: { type: Number, default: 0 },
    },

    rateLimit: {
      maxConcurrency: { type: Number, default: 4, min: 1, max: 50 },
      costBudgetPerSecond: { type: Number },
    },

    createdBy: {
      userId: { type: String, trim: true },
      email: { type: String, trim: true },
      ip: { type: String, trim: true },
    },

    error: {
      message: { type: String },
      code: { type: String },
      details: { type: mongoose.Schema.Types.Mixed },
    },
  },
  { timestamps: true }
);

JobSchema.index({ shopId: 1, idempotencyKey: 1 }, { unique: true });
JobSchema.index({ shopId: 1, status: 1, createdAt: -1 });

export default getModel("Job", JobSchema);
