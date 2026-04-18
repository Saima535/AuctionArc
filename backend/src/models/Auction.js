import mongoose from "mongoose";
import { AUCTION_STATUSES } from "../constants/enums.js";

const auctionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: AUCTION_STATUSES,
      default: "Scheduled",
    },
    reserveStatus: { type: String, default: "Pending" },
    currentBid: { type: Number, default: 0 },
    watcherCount: { type: Number, default: 0 },
    bidCount: { type: Number, default: 0 },
    startAt: Date,
    endAt: Date,
    featured: { type: Boolean, default: false },
    category: String,
  },
  {
    timestamps: true,
  },
);

auctionSchema.index({ seller: 1, status: 1 });

export const Auction = mongoose.model("Auction", auctionSchema);
