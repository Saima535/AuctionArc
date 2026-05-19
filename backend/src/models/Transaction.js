import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    type: { type: String, required: true },
    status: { type: String, required: true },
    amount: { type: Number, required: true },
    channel: { type: String, required: true },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

transactionSchema.index({ user: 1, createdAt: -1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);
