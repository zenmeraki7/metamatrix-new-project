// models/_utils.js
import mongoose from "mongoose";

export function getModel(name, schema) {
  return mongoose.models[name] || mongoose.model(name, schema);
}

export const GidString = {
  type: String,
  required: true,
  trim: true,
};

export function lowerTrim(v) {
  return typeof v === "string" ? v.trim().toLowerCase() : v;
}
