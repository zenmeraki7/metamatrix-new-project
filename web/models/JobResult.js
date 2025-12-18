// models/JobResult.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const JobResultSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },

    resourceType: { type: String, enum: ["PRODUCT", "VARIANT", "INVENTORY", "COLLECTION"], required: true, index: true },
    resourceId: { type: String, required: true, trim: true, index: true },

    status: { type: String, enum: ["changed", "unchanged", "failed", "skipped"], required: true, index: true },

    changedFields: { type: [String], default: [] },
    batchNo: { type: Number },

    error: {
      message: { type: String },
      code: { type: String },
      raw: { type: mongoose.Schema.Types.Mixed },
    },
  },
  { timestamps: true }
);

JobResultSchema.index({ shopId: 1, jobId: 1, status: 1 });
JobResultSchema.index({ shopId: 1, jobId: 1, resourceId: 1 });

export default getModel("JobResult", JobResultSchema);
