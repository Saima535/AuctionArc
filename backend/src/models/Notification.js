/**
 * Stores in-app notification records shown to users.
 */
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
    type: {
      type: String,
      default: "general",
      trim: true,
      maxlength: 60,
    },
    href: {
      type: String,
      default: "",
      trim: true,
      maxlength: 240,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
