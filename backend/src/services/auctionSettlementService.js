import { Auction } from "../models/Auction.js";
import { Bid } from "../models/Bid.js";
import { Listing } from "../models/Listing.js";
import { Order } from "../models/Order.js";
import { createNotification, createNotifications } from "./notificationService.js";
import { publishLiveEvent } from "./liveUpdateService.js";
import { generateUniqueCode } from "../utils/codeGenerator.js";
import { formatCurrency } from "../utils/formatters.js";

const REVIEW_BID_STATUSES = ["Held", "Review", "Pending check"];
const ACTIVE_AUCTION_STATUSES = ["Scheduled", "Live", "Extended"];

async function createWinnerOrder({ auction, listing, winningBid }) {
  const existingOrder =
    await Order.findOne({
      listing: listing._id,
      bidder: winningBid.bidder,
      amount: winningBid.amount,
    }) || await Order.findOne({ listing: listing._id, status: { $in: ["Awaiting payout", "In escrow", "Paid", "Awaiting shipment", "Delivered", "Completed"] } });

  if (existingOrder) {
    return existingOrder;
  }

  const code = await generateUniqueCode(Order, "ORD-", { digits: 4, min: 5001 });

  return Order.create({
    code,
    item: listing.title || auction.title,
    seller: auction.seller,
    bidder: winningBid.bidder,
    listing: listing._id,
    amount: winningBid.amount,
    escrowAmount: winningBid.amount,
    status: "In escrow",
  });
}

async function settleAuction(auction) {
  if (!auction.endAt || auction.endAt.getTime() > Date.now()) {
    return { auction, order: null, finalized: false };
  }

  if (auction.status === "Closed") {
    const existingOrder = await Order.findOne({ listing: auction.listing });
    return { auction, order: existingOrder, finalized: false };
  }

  const [listing, bids] = await Promise.all([
    Listing.findById(auction.listing),
    Bid.find({
      auction: auction._id,
      status: { $nin: REVIEW_BID_STATUSES },
    }).sort({ amount: -1, createdAt: 1 }),
  ]);

  if (!listing) {
    auction.status = "Closed";
    await auction.save();
    return { auction, order: null, finalized: true };
  }

  const winningBid = bids[0] || null;
  auction.status = "Closed";
  await auction.save();

  if (!winningBid) {
    await createNotification({
      userId: auction.seller,
      title: "Auction ended without a winner",
      body: `"${auction.title}" has closed without an eligible winning bid.`,
      type: "auction",
      href: "/seller/auctions",
      metadata: {
        auctionId: auction._id,
        listingId: listing._id,
      },
    });

    publishLiveEvent({
      event: "auction.closed",
      channels: ["market:auctions", "market:orders"],
      userIds: [auction.seller],
      roles: ["Admin"],
      payload: {
        auctionId: auction._id,
        listingId: listing._id,
        orderCreated: false,
      },
    });

    return { auction, order: null, finalized: true };
  }

  await Bid.updateMany(
    {
      auction: auction._id,
      _id: { $ne: winningBid._id },
      status: { $nin: REVIEW_BID_STATUSES },
    },
    { $set: { status: "Outbid" } },
  );
  await Bid.findByIdAndUpdate(winningBid._id, { $set: { status: "Top bid" } });

  const order = await createWinnerOrder({ auction, listing, winningBid });

  await createNotifications([
    {
      userId: winningBid.bidder,
      title: "You won the auction",
      body: `You won "${listing.title}" with a bid of ${formatCurrency(winningBid.amount)}.`,
      type: "order",
      href: "/bidder/wins",
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
      body: `"${listing.title}" closed at ${formatCurrency(winningBid.amount)} and is ready for fulfillment.`,
      type: "order",
      href: "/seller/orders",
      metadata: {
        auctionId: auction._id,
        listingId: listing._id,
        orderId: order._id,
        bidderId: winningBid.bidder,
        amount: winningBid.amount,
      },
    },
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

  return { auction, order, finalized: true };
}

export async function finalizeExpiredAuctions(filters = {}) {
  const query = {
    status: { $in: ACTIVE_AUCTION_STATUSES },
    endAt: { $lte: new Date() },
    ...filters,
  };

  const auctions = await Auction.find(query).sort({ endAt: 1 });
  const results = [];

  for (const auction of auctions) {
    results.push(await settleAuction(auction));
  }

  return results;
}

export async function finalizeAuctionIfEnded(auctionId) {
  const auction = await Auction.findById(auctionId);

  if (!auction) {
    return null;
  }

  return settleAuction(auction);
}
