import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    target: { type: String, required: true },
    severity: { type: String, required: true },
    status: { type: String, required: true },
    owner: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

export const Report = mongoose.model("Report", reportSchema);
