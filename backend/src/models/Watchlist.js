import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

watchlistSchema.index({ user: 1, auction: 1 }, { unique: true });

export const Watchlist = mongoose.model("Watchlist", watchlistSchema);
