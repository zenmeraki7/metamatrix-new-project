// models/JobBatch.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const JobBatchSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },

    batchNo: { type: Number, required: true },
    status: { type: String, enum: ["queued", "running", "succeeded", "failed"], default: "queued", index: true },

    resourceIds: { type: [String], default: [] }, // Shopify GIDs
    mutationType: { type: String, required: true, trim: true, index: true },

    payload: { type: mongoose.Schema.Types.Mixed, required: true },

    attempts: { type: Number, default: 0 },
    lastError: {
      message: { type: String },
      at: { type: Date },
      raw: { type: mongoose.Schema.Types.Mixed },
    },

    shopifyRequestIds: { type: [String], default: [] },

    startedAt: { type: Date },
    finishedAt: { type: Date },
  },
  { timestamps: true }
);

JobBatchSchema.index({ shopId: 1, jobId: 1, batchNo: 1 }, { unique: true });
JobBatchSchema.index({ shopId: 1, jobId: 1, status: 1 });

export default getModel("JobBatch", JobBatchSchema);
