/**
 * Deletes a user and the marketplace records directly tied to that account.
 */
import mongoose from "mongoose";
import { Auction } from "../models/Auction.js";
import { Bid } from "../models/Bid.js";
import { Conversation } from "../models/Conversation.js";
import { Listing } from "../models/Listing.js";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";
import { Order } from "../models/Order.js";
import { Thread } from "../models/Thread.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { Watchlist } from "../models/Watchlist.js";
import { publishLiveEvent } from "./liveUpdateService.js";
import { ApiError } from "../utils/apiError.js";

export async function deleteUserAccountCompletely(userId, { deletedByAdmin = false } = {}) {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (user.role === "Admin") {
    throw new ApiError(400, "Administrator accounts cannot be deleted from this flow.");
  }

  const session = await mongoose.startSession();
  let deletedPayload = null;

  try {
    await session.withTransaction(async () => {
      const sellerListings = await Listing.find({ seller: user._id }).select("_id").session(session);
      const sellerListingIds = sellerListings.map((listing) => listing._id);

      const sellerAuctions = await Auction.find({
        $or: [
          { seller: user._id },
          { listing: { $in: sellerListingIds } },
        ],
      }).select("_id").session(session);
      const sellerAuctionIds = sellerAuctions.map((auction) => auction._id);

      const bidderBids = await Bid.find({ bidder: user._id }).select("_id auction").session(session);
      const bidderAuctionIds = bidderBids.map((bid) => bid.auction).filter(Boolean);

      const orderIds = await Order.find({
        $or: [
          { seller: user._id },
          { bidder: user._id },
          ...(sellerListingIds.length ? [{ listing: { $in: sellerListingIds } }] : []),
        ],
      }).distinct("_id").session(session);

      const conversationIds = await Conversation.find({
        participants: user._id,
      }).distinct("_id").session(session);

      await Notification.deleteMany({ user: user._id }).session(session);
      await Watchlist.deleteMany({
        $or: [
          { user: user._id },
          ...(sellerAuctionIds.length ? [{ auction: { $in: sellerAuctionIds } }] : []),
          ...(bidderAuctionIds.length ? [{ auction: { $in: bidderAuctionIds } }] : []),
        ],
      }).session(session);

      await Bid.deleteMany({
        $or: [
          { bidder: user._id },
          ...(sellerAuctionIds.length ? [{ auction: { $in: sellerAuctionIds } }] : []),
          ...(sellerListingIds.length ? [{ listing: { $in: sellerListingIds } }] : []),
        ],
      }).session(session);

      if (conversationIds.length) {
        await Message.deleteMany({
          $or: [
            { conversationId: { $in: conversationIds } },
            { senderId: user._id },
            { receiverId: user._id },
          ],
        }).session(session);
        await Conversation.deleteMany({ _id: { $in: conversationIds } }).session(session);
      } else {
        await Message.deleteMany({
          $or: [{ senderId: user._id }, { receiverId: user._id }],
        }).session(session);
      }

      await Thread.deleteMany({ "participants.user": user._id }).session(session);

      if (orderIds.length) {
        await Transaction.deleteMany({
          $or: [
            { order: { $in: orderIds } },
            { user: user._id },
          ],
        }).session(session);
        await Order.deleteMany({ _id: { $in: orderIds } }).session(session);
      } else {
        await Transaction.deleteMany({ user: user._id }).session(session);
      }

      if (sellerAuctionIds.length) {
        await Auction.deleteMany({ _id: { $in: sellerAuctionIds } }).session(session);
      }

      if (sellerListingIds.length) {
        await Listing.deleteMany({ _id: { $in: sellerListingIds } }).session(session);
      }

      await User.deleteOne({ _id: user._id }).session(session);

      deletedPayload = {
        userId: String(user._id),
        role: user.role,
        deletedByAdmin,
        listingIds: sellerListingIds.map(String),
        auctionIds: sellerAuctionIds.map(String),
        orderIds: orderIds.map(String),
      };
    });
  } finally {
    await session.endSession();
  }

  publishLiveEvent({
    event: "user.deleted",
    channels: ["market:auctions", "market:orders", "market:bids", "market:watchlist"],
    userIds: [userId],
    roles: ["Admin"],
    payload: deletedPayload || { userId: String(userId) },
  });

  return deletedPayload || { userId: String(userId) };
}
