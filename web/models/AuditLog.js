// models/AuditLog.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const AuditLogSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },

    actor: {
      type: { type: String, enum: ["merchant", "system"], required: true },
      userId: { type: String, trim: true },
      email: { type: String, trim: true },
    },

    action: { type: String, required: true, trim: true, index: true }, // e.g. "rule.created"
    entity: {
      type: { type: String, required: true, trim: true },
      id: { type: mongoose.Schema.Types.Mixed, required: true },
    },

    meta: { type: mongoose.Schema.Types.Mixed },
    at: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

AuditLogSchema.index({ shopId: 1, at: -1 });
AuditLogSchema.index({ shopId: 1, action: 1, at: -1 });

export default getModel("AuditLog", AuditLogSchema);
