// models/ChangeSet.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

// Note: TTL is best enforced by a cleanup job using Shop.settings.rollbackRetentionDays.
// Mongo TTL cannot be dynamic per tenant.
const ChangeSetSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },

    resourceType: { type: String, enum: ["PRODUCT", "VARIANT", "INVENTORY", "COLLECTION"], required: true, index: true },
    resourceId: { type: String, required: true, trim: true, index: true },

    // Store minimal touched fields only
    before: { type: mongoose.Schema.Types.Mixed, required: true },
    afterPreview: { type: mongoose.Schema.Types.Mixed }, // optional
    afterApplied: { type: mongoose.Schema.Types.Mixed }, // optional

    fields: { type: [String], default: [], index: true },

    checksumBefore: { type: String, required: true, trim: true },
    checksumAfter: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

ChangeSetSchema.index({ shopId: 1, jobId: 1, resourceId: 1 });
ChangeSetSchema.index({ shopId: 1, resourceId: 1, createdAt: -1 });

export default getModel("ChangeSet", ChangeSetSchema);
