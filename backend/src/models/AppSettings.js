import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    items: [String],
  },
  { _id: false },
);

const appSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    sections: [sectionSchema],
  },
  {
    timestamps: true,
  },
);

export const AppSettings = mongoose.model("AppSettings", appSettingsSchema);
