// models/CsvImport.js
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const CsvImportSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },

    status: { type: String, enum: ["uploaded", "parsing", "validated", "queued", "running", "completed", "failed"], default: "uploaded", index: true },
    target: { type: String, enum: ["PRODUCT", "VARIANT", "INVENTORY", "COLLECTION"], required: true, index: true },

    file: {
      storageKey: { type: String, required: true },
      filename: { type: String, required: true },
      size: { type: Number, required: true },
      uploadedAt: { type: Date, default: Date.now },
    },

    mapping: {
      idColumn: { type: String, required: true },
      columns: [
        {
          csvColumn: { type: String, required: true },
          fieldPath: { type: String, required: true }, // e.g. "variants.$.price" or "seo.title"
          transform: { type: mongoose.Schema.Types.Mixed },
        },
      ],
    },

    stats: {
      rowsTotal: { type: Number, default: 0 },
      rowsValid: { type: Number, default: 0 },
      rowsInvalid: { type: Number, default: 0 },
    },

    errorsSample: [
      {
        row: { type: Number },
        message: { type: String },
      },
    ],

    error: {
      message: { type: String },
      details: { type: mongoose.Schema.Types.Mixed },
    },
  },
  { timestamps: true }
);

CsvImportSchema.index({ shopId: 1, status: 1, createdAt: -1 });

export default getModel("CsvImport", CsvImportSchema);
