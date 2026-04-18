import mongoose from "mongoose";
import { BID_STATUSES } from "../constants/enums.js";

const bidSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: BID_STATUSES,
      default: "Valid",
    },
    signal: { type: String, default: "Normal" },
  },
  {
    timestamps: true,
  },
);

bidSchema.index({ auction: 1, bidder: 1, createdAt: -1 });

export const Bid = mongoose.model("Bid", bidSchema);
