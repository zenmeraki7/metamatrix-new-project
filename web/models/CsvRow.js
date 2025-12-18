// models/CsvRow.js (optional; only if you need resumable large imports)
import mongoose from "mongoose";
import { getModel } from "./_utils.js";

const CsvRowSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    csvImportId: { type: mongoose.Schema.Types.ObjectId, ref: "CsvImport", required: true, index: true },

    rowNo: { type: Number, required: true },
    resourceId: { type: String, trim: true, index: true },

    data: { type: mongoose.Schema.Types.Mixed, required: true },

    status: { type: String, enum: ["valid", "invalid", "applied", "failed"], required: true, index: true },
    error: { type: String },
  },
  { timestamps: true }
);

CsvRowSchema.index({ shopId: 1, csvImportId: 1, rowNo: 1 }, { unique: true });

export default getModel("CsvRow", CsvRowSchema);
