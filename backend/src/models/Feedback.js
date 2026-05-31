/**
 * Stores one order-linked rating/feedback entry from either seller or buyer.
 */
import mongoose from "mongoose";
import { PUBLIC_ROLES } from "../constants/enums.js";

const feedbackSchema = new mongoose.Schema(
  {
    // Human-readable code keeps admin operations consistent with the rest of the app.
    code: { type: String, required: true, unique: true },
    // Feedback is always attached to a real commercial order so the feature
    // cannot be used without an actual buyer-seller transaction.
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
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
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // fromUser/toUser preserve direction so admins can review who rated whom.
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromRole: {
      type: String,
      enum: PUBLIC_ROLES,
      required: true,
    },
    toRole: {
      type: String,
      enum: PUBLIC_ROLES,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

// One participant may leave only one feedback entry per order.
feedbackSchema.index({ order: 1, fromUser: 1 }, { unique: true });
feedbackSchema.index({ toUser: 1, createdAt: -1 });
feedbackSchema.index({ seller: 1, bidder: 1, createdAt: -1 });

export const Feedback = mongoose.model("Feedback", feedbackSchema);
