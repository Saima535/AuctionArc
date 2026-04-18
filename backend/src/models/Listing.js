import mongoose from "mongoose";
import { LISTING_STATUSES } from "../constants/enums.js";

const imageSchema = new mongoose.Schema(
  {
    publicId: String,
    url: String,
  },
  { _id: false },
);

const listingSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: LISTING_STATUSES,
      default: "Draft",
    },
    reserveStatus: { type: String, default: "Pending" },
    price: { type: Number, default: 0 },
    reservePrice: { type: Number, default: 0 },
    currentBid: { type: Number, default: 0 },
    bidCount: { type: Number, default: 0 },
    watcherCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    images: [imageSchema],
    notes: [{ type: String }],
  },
  {
    timestamps: true,
  },
);

listingSchema.index({ seller: 1, status: 1 });

export const Listing = mongoose.model("Listing", listingSchema);
