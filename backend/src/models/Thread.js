import mongoose from "mongoose";
import { THREAD_PRIORITIES, THREAD_STATUSES } from "../constants/enums.js";

const threadMessageSchema = new mongoose.Schema(
  {
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    body: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    roleLabel: String,
    name: String,
  },
  { _id: false },
);

const threadSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    priority: {
      type: String,
      enum: THREAD_PRIORITIES,
      default: "Normal",
    },
    status: {
      type: String,
      enum: THREAD_STATUSES,
      default: "Open",
    },
    participants: [participantSchema],
    messages: [threadMessageSchema],
  },
  {
    timestamps: true,
  },
);

threadSchema.virtual("lastMessage").get(function getLastMessage() {
  return this.messages[this.messages.length - 1];
});

export const Thread = mongoose.model("Thread", threadSchema);
