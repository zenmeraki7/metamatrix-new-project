// models/WebhookEvent.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

// You will likely apply a fixed TTL via index (e.g., 14 days) to control growth.
const WebhookEventSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },

    topic: { type: String, required: true, trim: true, index: true },
    shopifyWebhookId: { type: String, trim: true, index: true },

    payload: { type: mongoose.Schema.Types.Mixed, required: true },

    receivedAt: { type: Date, default: Date.now, index: true },
    processedAt: { type: Date },

    status: { type: String, enum: ["received", "processed", "failed"], default: "received", index: true },
    error: { type: String },
  },
  { timestamps: true }
);

WebhookEventSchema.index({ shopId: 1, topic: 1, receivedAt: -1 });

export default getModel("WebhookEvent", WebhookEventSchema);
