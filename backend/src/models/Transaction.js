import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, required: true },
    status: { type: String, required: true },
    amount: { type: Number, required: true },
    channel: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

transactionSchema.index({ user: 1, createdAt: -1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);
