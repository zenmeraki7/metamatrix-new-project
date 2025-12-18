// models/Notification.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const NotificationSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },

    type: { type: String, enum: ["job_complete", "job_failed", "trigger_fired", "sync_failed"], required: true, index: true },
    severity: { type: String, enum: ["info", "warning", "critical"], default: "info", index: true },

    title: { type: String, required: true },
    body: { type: String },

    data: { type: mongoose.Schema.Types.Mixed },

    readAt: { type: Date, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ shopId: 1, readAt: 1, createdAt: -1 });

export default getModel("Notification", NotificationSchema);
