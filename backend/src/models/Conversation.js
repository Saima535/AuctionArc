import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // Core participants
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Related auction/listing (optional)
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      default: null,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      default: null,
    },

    // Message tracking
    lastMessage: {
      type: String,
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    lastMessageSenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Read status tracking
    buyerLastReadAt: {
      type: Date,
      default: Date.now,
    },
    sellerLastReadAt: {
      type: Date,
      default: Date.now,
    },

    // Status
    status: {
      type: String,
      enum: ["Active", "Archived", "Closed"],
      default: "Active",
    },

    // Block status (if either user blocks the other)
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Create composite index for buyerId + sellerId to ensure one conversation per pair
conversationSchema.index({ buyerId: 1, sellerId: 1 }, { unique: true });

// Index for querying conversations by participant
conversationSchema.index({ participants: 1 });

// Index for getting recent conversations
conversationSchema.index({ lastMessageAt: -1 });

// Index for aggregation queries
conversationSchema.index({ buyerId: 1, status: 1, lastMessageAt: -1 });
conversationSchema.index({ sellerId: 1, status: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
