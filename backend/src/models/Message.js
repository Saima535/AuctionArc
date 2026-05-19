/**
 * Stores message documents used by the newer conversation system.
 */
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // Reference to conversation
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    // Sender and receiver info
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Message content
    text: {
      type: String,
      required: true,
      maxlength: 4000,
      trim: true,
    },

    // Message type (text, system, etc.)
    type: {
      type: String,
      enum: ["text", "system"],
      default: "text",
    },

    // Read status
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },

    // Optional attachments/media (for future enhancement)
    attachments: [
      {
        type: {
          type: String,
          enum: ["image", "file", "link"],
        },
        url: String,
        name: String,
        size: Number,
      },
    ],

    // Edit tracking
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },

    // Deletion (soft delete for audit trail)
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  },
);

// Indexes for efficient queries
messageSchema.index({ conversationId: 1, createdAt: -1 }); // Get messages for a conversation
messageSchema.index({ conversationId: 1, isRead: 1 }); // Count unread messages
messageSchema.index({ senderId: 1, conversationId: 1 }); // Query by sender
messageSchema.index({ receiverId: 1, isRead: 1 }); // Get unread messages for a user
messageSchema.index({ createdAt: -1 }); // Recent messages

export const Message = mongoose.model("Message", messageSchema);
