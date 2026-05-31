/**
 * Finalizes ended auctions, selects winners, creates orders, and emits follow-up notifications.
 */
import mongoose from "mongoose";
import { Auction } from "../models/Auction.js";
import { Bid } from "../models/Bid.js";
import { Listing } from "../models/Listing.js";
import { Order } from "../models/Order.js";
import { Watchlist } from "../models/Watchlist.js";
import {
  createNotificationOnce,
  createNotificationsOnce,
} from "./notificationService.js";
import { publishLiveEvent } from "./liveUpdateService.js";
import { calculateCommissionBreakdown } from "./commissionService.js";
import { generateUniqueCode } from "../utils/codeGenerator.js";
import { formatCurrency } from "../utils/formatters.js";
import { isAuctionExpired } from "./auctionQueryService.js";

const REVIEW_BID_STATUSES = ["Held", "Review", "Pending check"];
const ACTIVE_AUCTION_STATUSES = ["Scheduled", "Live", "Extended"];
const ENDING_SOON_WINDOW_MS = 60 * 60 * 1000;
const AUCTION_SETTLEMENT_BATCH_SIZE = parseInt(process.env.AUCTION_SETTLEMENT_BATCH_SIZE, 10) || 50;
const SETTLING_STALE_THRESHOLD_MS = 5 * 60 * 1000;

// Settlement reuses an existing winner order when possible so repeat scheduler
// passes do not create duplicate order records.
async function createWinnerOrder({ auction, listing, winningBid, session }) {
  // A fresh code is generated only for true inserts; repeated settlement passes
  // still reuse the same logical order if it already exists.
  const code = await generateUniqueCode(Order, "ORD-", { digits: 4, min: 5001 });
  const { commissionAmount, sellerPayoutAmount } = calculateCommissionBreakdown(winningBid.amount);

  const order = await Order.findOneAndUpdate(
    {
      listing: listing._id,
      bidder: winningBid.bidder,
      amount: winningBid.amount,
    },
    {
      $setOnInsert: {
        // Item/title snapshots are stored on the order so fulfilment history
        // stays understandable even if listing data evolves later.
        code,
        item: listing.title || auction.title,
        seller: auction.seller,
        bidder: winningBid.bidder,
        listing: listing._id,
        amount: winningBid.amount,
        commissionAmount,
        sellerPayoutAmount,
        escrowAmount: sellerPayoutAmount,
        // Auction settlement orders are explicitly tagged so they remain
        // distinguishable from instant buy-now purchases.
        purchaseType: "Auction win",
        status: "Payment pending",
      },
    },
    {
      upsert: true,
      new: true,
      session,
      setDefaultsOnInsert: true,
    },
  );

  return order;
}

// Settlement is the bridge from bidding to commerce. Once an auction ends, this
// routine decides whether it sold, expired, or missed reserve.
async function settleAuction(auction) {
  const now = new Date();

  // Auctions without an elapsed end time are not yet eligible for settlement.
  if (!auction.endAt || auction.endAt.getTime() > now.getTime()) {
    return { auction, order: null, finalized: false };
  }

  // Already-closed auctions with a settlement timestamp are treated as
  // finalized and only surface their existing commercial result.
  if (auction.status === "Closed" && auction.settledAt) {
    const existingOrder = await Order.findOne({ listing: auction.listing });
    return { auction, order: existingOrder, finalized: false };
  }

  const session = await mongoose.startSession();
  let result = { auction, order: null, finalized: false };
  let listing = null;
  let winningBid = null;
  let reservationFailed = false;
  let noWinner = false;

  try {
    await session.withTransaction(async () => {
      // Claim the auction first so only one backend worker can settle it.
      const claimedAuction = await Auction.findOneAndUpdate(
        {
          _id: auction._id,
          status: { $in: ACTIVE_AUCTION_STATUSES },
          endAt: { $lte: now },
          $or: [
            { settling: { $ne: true } },
            { settlingAt: { $lte: new Date(now.getTime() - SETTLING_STALE_THRESHOLD_MS) } },
          ],
        },
        {
          $set: { settling: true, settlingAt: now },
        },
        { new: true, session },
      );

      if (!claimedAuction) {
        result = { auction, order: null, finalized: false };
        return;
      }

      auction = claimedAuction;
      // Listing and eligible bids are loaded together so the settlement branch
      // can choose the correct commerce outcome inside one transaction.
      [listing, winningBid] = await Promise.all([
        Listing.findById(auction.listing).session(session),
        Bid.find({
          auction: auction._id,
          status: { $nin: REVIEW_BID_STATUSES },
        })
          .sort({ amount: -1, createdAt: 1 })
          .session(session),
      ]);

      if (!listing) {
        // Missing listings still force auction closure so the scheduler does not
        // spin forever on broken data.
        auction.status = "Closed";
        auction.settledAt = auction.settledAt || now;
        auction.closedReason = auction.closedReason || "listing-missing";
        auction.settling = false;
        auction.settlingAt = null;
        await auction.save({ session });
        result = { auction, order: null, finalized: true };
        return;
      }

      winningBid = winningBid[0] || null;
      // Every terminal branch below marks the auction closed and clears any
      // temporary settlement claim flags.
      auction.status = "Closed";
      auction.settledAt = auction.settledAt || now;
      auction.settling = false;
      auction.settlingAt = null;

      if (!winningBid) {
        // No eligible winner means the auction expires without creating an order.
        auction.winner = null;
        auction.winnerBid = null;
        auction.closedReason = "expired";
        await auction.save({ session });
        noWinner = true;
        result = { auction, order: null, finalized: true };
        return;
      }

      // Reserve checks happen after selecting the highest eligible bid.
      if (listing.reservePrice && winningBid.amount < listing.reservePrice) {
        // Reserve-not-met closes the auction without producing a sale.
        auction.winner = null;
        auction.winnerBid = null;
        auction.closedReason = "reserve-not-met";
        await auction.save({ session });
        reservationFailed = true;
        result = { auction, order: null, finalized: true };
        return;
      }

      await Bid.updateMany(
        {
          auction: auction._id,
          _id: { $ne: winningBid._id },
          status: { $nin: REVIEW_BID_STATUSES },
        },
        { $set: { status: "Outbid" } },
        { session },
      );

      await Bid.findByIdAndUpdate(
        winningBid._id,
        // The winning bid is normalized to "Top bid" so downstream buyer/seller
        // UIs reflect the final standing cleanly.
        { $set: { status: "Top bid" } },
        { session },
      );

      // A successful sale produces exactly one pending-payment order.
      const order = await createWinnerOrder({ auction, listing, winningBid, session });
      auction.winner = winningBid.bidder;
      auction.winnerBid = winningBid._id;
      auction.closedReason = "sold";
      await auction.save({ session });
      result = { auction, order, finalized: true };
    });
  } finally {
    session.endSession();
  }

  if (!result.finalized) {
    // If another worker settled it first, we return the untouched result and
    // let the caller continue without duplicate side effects.
    return result;
  }

  if (!listing) {
    // If listing was missing, no notification is required beyond the DB update.
    publishLiveEvent({
      event: "auction.closed",
      channels: ["market:auctions"],
      userIds: [auction.seller],
      roles: ["Admin"],
      payload: {
        auctionId: auction._id,
        listingId: auction.listing,
        orderCreated: false,
      },
    });

    return result;
  }

  if (noWinner) {
    // "No eligible winner" has a different user message than "you were outbid".
    const [bidderIds, watchlistUserIds] = await Promise.all([
      Bid.find({
        auction: auction._id,
        status: { $nin: REVIEW_BID_STATUSES },
      }).distinct("bidder"),
      Watchlist.find({ auction: auction._id }).distinct("user"),
    ]);

    await createNotificationOnce({
      userId: auction.seller,
      title: "Auction ended without a winning bid",
      body: `"${listing.title}" has closed without an eligible winning bid.`,
      type: "auction",
      href: "/seller/auctions",
      dedupKey: `auction-ended-no-winner:${auction._id}`,
      metadata: {
        auctionId: auction._id,
        listingId: listing._id,
      },
    });

    await createNotificationsOnce(
      Array.from(
        new Set([...bidderIds, ...watchlistUserIds].map((userId) => String(userId)).filter(Boolean)),
      ).map((userId) => ({
        userId,
        title: "Auction finished",
        body: `"${listing.title}" ended without a winning bid.`,
        type: "auction",
        href: bidderIds.some((bidderId) => String(bidderId) === userId)
          ? "/bidder/my-bids"
          : "/bidder/watchlist",
        dedupKey: `auction-finished:${auction._id}:no-winner:${userId}`,
        metadata: {
          auctionId: auction._id,
          listingId: listing._id,
          outcome: "no-winner",
        },
      })),
    );

    publishLiveEvent({
      event: "auction.closed",
      channels: ["market:auctions", "market:orders"],
      userIds: [auction.seller],
      roles: ["Admin"],
      payload: {
        auctionId: auction._id,
        listingId: listing._id,
        orderCreated: false,
        reason: "no-winner",
      },
    });

    return result;
  }

  if (reservationFailed) {
    // Reserve failure notifies the seller and watchers but intentionally avoids
    // creating an order or naming a winner.
    await createNotificationOnce({
      userId: auction.seller,
      title: "Reserve price not met",
      body: `"${listing.title}" closed without a sale because the reserve price was not met.`,
      type: "auction",
      href: "/seller/auctions",
      dedupKey: `auction-reserve-not-met:${auction._id}`,
      metadata: {
        auctionId: auction._id,
        listingId: listing._id,
      },
    });

    const [watchlistUserIds] = await Promise.all([
      Watchlist.find({ auction: auction._id }).distinct("user"),
    ]);

    await createNotificationsOnce(
      Array.from(new Set(watchlistUserIds.map((userId) => String(userId)).filter(Boolean))).map((userId) => ({
        userId,
        title: "Auction finished",
        body: `"${listing.title}" closed without a sale.`,
        type: "auction",
        href: "/bidder/watchlist",
        dedupKey: `auction-finished:${auction._id}:reserve-not-met:${userId}`,
        metadata: {
          auctionId: auction._id,
          listingId: listing._id,
          outcome: "reserve-not-met",
        },
      })),
    );

    publishLiveEvent({
      event: "auction.closed",
      channels: ["market:auctions", "market:orders"],
      userIds: [auction.seller],
      roles: ["Admin"],
      payload: {
        auctionId: auction._id,
        listingId: listing._id,
        orderCreated: false,
        reason: "reserve-not-met",
      },
    });

    return result;
  }

  // Once an order exists, the follow-up path shifts from auction closing to payment.
  const order = result.order;
  // Losing bidders and passive watchers receive distinct notifications so the
  // post-auction experience matches each user’s actual involvement.
  const allBids = await Bid.find({ auction: auction._id, status: { $nin: REVIEW_BID_STATUSES } }).sort({ amount: -1, createdAt: 1 });
  const losingBidderIds = Array.from(
    new Set(
      allBids
        .slice(1)
        .map((bid) => String(bid.bidder || ""))
        .filter(Boolean),
    ),
  );
  const watchlistUserIds = await Watchlist.find({ auction: auction._id }).distinct("user");
  const finishedWatcherIds = watchlistUserIds.filter((userId) => {
    const normalizedUserId = String(userId);
    return normalizedUserId !== String(winningBid.bidder) && !losingBidderIds.includes(normalizedUserId);
  });

  await createNotificationsOnce([
    {
      userId: winningBid.bidder,
      title: "Congratulations! You have won the bid",
      body: `You won "${listing.title}" with a bid of ${formatCurrency(winningBid.amount)}. Complete payment to confirm your order.`,
      type: "order",
      href: "/bidder/wins",
      dedupKey: `auction-won:${auction._id}:${winningBid.bidder}`,
      metadata: {
        auctionId: auction._id,
        listingId: listing._id,
        orderId: order._id,
        amount: winningBid.amount,
      },
    },
    {
      userId: auction.seller,
      title: "Auction winner selected",
      body: `"${listing.title}" closed at ${formatCurrency(winningBid.amount)} and payment is pending.`,
      type: "order",
      href: "/seller/orders",
      dedupKey: `auction-winner-selected:${auction._id}:${auction.seller}`,
      metadata: {
        auctionId: auction._id,
        listingId: listing._id,
        orderId: order._id,
        bidderId: winningBid.bidder,
        amount: winningBid.amount,
      },
    },
    {
      userId: winningBid.bidder,
      title: "Payment required",
      body: `Please complete payment for "${listing.title}" to confirm your winning order.`,
      type: "payment",
      href: "/bidder/wins",
      dedupKey: `auction-payment-required:${auction._id}:${winningBid.bidder}`,
      metadata: {
        auctionId: auction._id,
        orderId: order._id,
        amount: winningBid.amount,
      },
    },
    ...losingBidderIds.map((bidderId) => ({
      userId: bidderId,
      title: "Auction lost",
      body: `Another bidder won the auction for "${listing.title}".`,
      type: "auction",
      href: "/bidder/my-bids",
      dedupKey: `auction-lost:${auction._id}:${bidderId}`,
      metadata: {
        auctionId: auction._id,
        listingId: listing._id,
        orderId: order._id,
        winnerId: winningBid.bidder,
        amount: winningBid.amount,
      },
    })),
    ...finishedWatcherIds.map((userId) => ({
      userId,
      title: "Auction finished",
      body: `"${listing.title}" has ended at ${formatCurrency(winningBid.amount)}.`,
      type: "auction",
      href: "/bidder/watchlist",
      dedupKey: `auction-finished:${auction._id}:${userId}`,
      metadata: {
        auctionId: auction._id,
        listingId: listing._id,
        winnerId: winningBid.bidder,
        amount: winningBid.amount,
      },
    })),
  ]);

  publishLiveEvent({
    event: "auction.closed",
    channels: ["market:auctions", "market:bids", "market:orders"],
    userIds: [auction.seller, winningBid.bidder],
    roles: ["Admin"],
    payload: {
      auctionId: auction._id,
      listingId: listing._id,
      orderId: order._id,
      winnerBidId: winningBid._id,
      winnerId: winningBid.bidder,
      amount: winningBid.amount,
      orderCreated: true,
    },
  });

  return result;
}

async function notifyEndingSoonAuctions(filters = {}) {
  const now = new Date();
  const endingBy = new Date(now.getTime() + ENDING_SOON_WINDOW_MS);
  // Only active auctions inside the configured warning window trigger these reminders.
  const auctions = await Auction.find({
    status: { $in: ACTIVE_AUCTION_STATUSES },
    endAt: { $gt: now, $lte: endingBy },
    ...filters,
  }).select("_id listing title endAt");

  for (const auction of auctions) {
    // The reminder audience includes both current bidders and watchlist users.
    const [bidderIds, watchlistUserIds] = await Promise.all([
      Bid.find({
        auction: auction._id,
        status: { $nin: REVIEW_BID_STATUSES },
      }).distinct("bidder"),
      Watchlist.find({ auction: auction._id }).distinct("user"),
    ]);

    const bidderIdSet = new Set(bidderIds.map((bidderId) => String(bidderId)));
    const recipientIds = Array.from(
      new Set([...bidderIds, ...watchlistUserIds].map((userId) => String(userId)).filter(Boolean)),
    );

    if (!recipientIds.length) {
      continue;
    }

    const minutesRemaining = Math.max(
      Math.ceil((new Date(auction.endAt).getTime() - now.getTime()) / (60 * 1000)),
      1,
    );

    await createNotificationsOnce(
      recipientIds.map((userId) => ({
        userId,
        title: "Auction ending soon",
        body: `"${auction.title}" ends in about ${minutesRemaining} minute${minutesRemaining === 1 ? "" : "s"}.`,
        type: "auction",
        href: bidderIdSet.has(userId) ? "/bidder/my-bids" : "/bidder/watchlist",
        dedupKey: `auction-ending-soon:${auction._id}:hour`,
        metadata: {
          auctionId: auction._id,
          listingId: auction.listing,
          endsAt: auction.endAt,
          minutesRemaining,
        },
      })),
    );
  }
}

export async function finalizeExpiredAuctions(filters = {}) {
  // Maintenance sends ending-soon nudges before final settlement.
  await notifyEndingSoonAuctions(filters);

  // Only expired auctions in active states are candidates for actual settlement.
  const query = {
    status: { $in: ACTIVE_AUCTION_STATUSES },
    endAt: { $lte: new Date() },
    ...filters,
  };

  const auctions = await Auction.find(query).sort({ endAt: 1 }).limit(AUCTION_SETTLEMENT_BATCH_SIZE);
  const results = [];

  for (const auction of auctions) {
    // Settlement runs serially here to keep side effects deterministic and
    // reduce contention against overlapping order/auction updates.
    results.push(await settleAuction(auction));
  }

  return results;
}

export async function finalizeAuctionIfEnded(auctionId) {
  const auction = await Auction.findById(auctionId);

  // This helper is used by request-time flows such as bidding, where an expired
  // auction may need immediate settlement before the API can respond correctly.
  if (!auction || !isAuctionExpired(auction)) {
    return null;
  }

  return settleAuction(auction);
}
