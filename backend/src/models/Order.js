import mongoose from "mongoose";
import { ORDER_STATUSES } from "../constants/enums.js";

const orderSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    item: { type: String, required: true },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    amount: { type: Number, required: true },
    escrowAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Awaiting payout",
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ seller: 1, bidder: 1, status: 1 });

export const Order = mongoose.model("Order", orderSchema);
