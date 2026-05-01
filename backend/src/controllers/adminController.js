import { AppSettings } from "../models/AppSettings.js";
import { AUCTION_STATUSES, BID_STATUSES, LISTING_STATUSES, USER_STATUSES } from "../constants/enums.js";
import { Auction } from "../models/Auction.js";
import { Bid } from "../models/Bid.js";
import { Listing } from "../models/Listing.js";
import { Order } from "../models/Order.js";
import { Report } from "../models/Report.js";
import { Thread } from "../models/Thread.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import {
  serializeUser,
  toAuctionRow,
  toBidRow,
  toListingCard,
  toTableUser,
  toThreadRow,
  toTransactionRow,
} from "../services/mapperService.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { formatCurrency } from "../utils/formatters.js";
import { assertOneOf, pickAllowedKeys } from "../utils/validation.js";

function serializeBidDetail(bid) {
  return {
    id: bid.code,
    bidder: bid.bidder?.name || "Unknown bidder",
    bidderEmail: bid.bidder?.email || "Not available",
    amount: formatCurrency(bid.amount),
    status: bid.status,
    signal: bid.signal,
    placedAt: bid.createdAt?.toISOString().slice(0, 10) || "Unknown",
  };
}

async function serializeAuctionDetail(auction) {
  const bids = await Bid.find({ auction: auction._id })
    .populate("bidder")
    .sort({ amount: -1, createdAt: -1 })
    .limit(5);

  return {
    auctionId: auction._id,
    id: auction.code,
    title: auction.title,
    status: auction.status,
    category: auction.category || auction.listing?.category || "Uncategorized",
    product: auction.listing?.title || auction.title,
    productCode: auction.listing?.code || "No listing code",
    seller: auction.seller?.name || "Unknown seller",
    sellerEmail: auction.seller?.email || "Not available",
    currentBid: formatCurrency(auction.currentBid || 0),
    bids: String(auction.bidCount || bids.length),
    watchers: String(auction.watcherCount || 0),
    reserve: auction.reserveStatus,
    starts: auction.startAt?.toISOString().slice(0, 10) || "Not scheduled",
    ends: auction.endAt?.toISOString().slice(0, 10) || "Not scheduled",
    topBids: bids.map(serializeBidDetail),
  };
}

async function serializeListingReview(listing) {
  const bids = await Bid.find({ listing: listing._id })
    .populate("bidder")
    .sort({ amount: -1, createdAt: -1 })
    .limit(3);

  return {
    listingId: listing._id,
    id: listing.code,
    title: listing.title,
    status: listing.status,
    category: listing.category,
    seller: listing.seller?.name || "Unknown seller",
    sellerEmail: listing.seller?.email || "Not available",
    price: formatCurrency(listing.price || 0),
    reserve: formatCurrency(listing.reservePrice || 0),
    bids: String(listing.bidCount || bids.length),
    watchers: String(listing.watcherCount || 0),
    condition: listing.condition,
    delivery: listing.deliveryOption,
    topBids: bids.map(serializeBidDetail),
  };
}

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: { $in: ["Seller", "Bidder"] } }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: users.map((user) => ({
      userId: user._id,
      ...toTableUser(user),
    })),
  });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const nextStatus = req.body.status || user.status;
  user.status = assertOneOf(nextStatus, USER_STATUSES, "User status");
  await user.save();

  res.json({
    success: true,
    message: "User status updated successfully.",
    data: {
      userId: user._id,
      ...toTableUser(user),
    },
  });
});

export const getProducts = asyncHandler(async (req, res) => {
  const listings = await Listing.find({}).populate("seller").sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: listings.map((listing) => ({
      listingId: listing._id,
      id: listing.code,
      title: listing.title,
      seller: listing.seller?.name || "Unknown seller",
      category: listing.category,
      status: listing.status,
      price: formatCurrency(listing.price),
      bids: String(listing.bidCount),
    })),
  });
});

export const updateProductStatus = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.listingId);

  if (!listing) {
    throw new ApiError(404, "Listing not found.");
  }

  listing.status = assertOneOf(req.body.status || listing.status, LISTING_STATUSES, "Listing status");
  await listing.save();

  res.json({
    success: true,
    message: "Listing status updated successfully.",
    data: {
      listingId: listing._id,
      ...toListingCard(listing),
    },
  });
});

export const getAuctions = asyncHandler(async (req, res) => {
  const auctions = await Auction.find({}).sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: auctions.map(toAuctionRow),
  });
});

export const getAuctionDrilldown = asyncHandler(async (req, res) => {
  const scope = req.params.scope;

  if (scope === "pending") {
    const listings = await Listing.find({
      status: { $in: ["Draft", "Pending approval", "Pending review"] },
    })
      .populate("seller")
      .sort({ updatedAt: -1 });

    const rows = await Promise.all(listings.map(serializeListingReview));

    res.json({
      success: true,
      data: {
        scope,
        title: "Pending Auctions",
        description: "Products and listings waiting for approval or removal before entering the marketplace.",
        rows,
      },
    });
    return;
  }

  const statusFilter =
    scope === "live"
      ? { status: { $in: ["Live", "Extended"] } }
      : scope === "closed"
        ? { status: "Closed" }
        : null;

  if (!statusFilter) {
    throw new ApiError(400, "Unknown auction drilldown scope.");
  }

  const auctions = await Auction.find(statusFilter)
    .populate("seller")
    .populate("listing")
    .sort({ updatedAt: -1 });
  const rows = await Promise.all(auctions.map(serializeAuctionDetail));

  res.json({
    success: true,
    data: {
      scope,
      title: scope === "live" ? "Live Auctions" : "Closed Auctions",
      description:
        scope === "live"
          ? "Auctions still accepting bids, with product, seller, bidder, and bid details."
          : "Closed auction outcomes with product, seller, bidder, and final bid context.",
      rows,
    },
  });
});

export const updateAuctionStatus = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.auctionId);

  if (!auction) {
    throw new ApiError(404, "Auction not found.");
  }

  auction.status = assertOneOf(req.body.status || auction.status, AUCTION_STATUSES, "Auction status");
  await auction.save();

  res.json({
    success: true,
    message: "Auction status updated successfully.",
    data: toAuctionRow(auction),
  });
});

export const getBids = asyncHandler(async (req, res) => {
  const bids = await Bid.find({}).populate("auction bidder").sort({ createdAt: -1 });

  res.json({
    success: true,
    data: bids.map(toBidRow),
  });
});

export const updateBidStatus = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.bidId).populate("auction bidder");

  if (!bid) {
    throw new ApiError(404, "Bid not found.");
  }

  bid.status = assertOneOf(req.body.status || bid.status, BID_STATUSES, "Bid status");
  await bid.save();

  res.json({
    success: true,
    message: "Bid status updated successfully.",
    data: toBidRow(bid),
  });
});

export const getChats = asyncHandler(async (req, res) => {
  const threads = await Thread.find({}).sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: threads.map(toThreadRow),
  });
});

export const getReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({}).sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: reports.map((report) => ({
      reportId: report._id,
      id: report.code,
      target: report.target,
      reason: report.type,
      severity: report.severity,
      status: report.status,
      owner: report.owner,
      date: report.createdAt?.toISOString().slice(0, 10) || "Unknown",
    })),
  });
});

export const updateReportStatus = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.reportId);

  if (!report) {
    throw new ApiError(404, "Report not found.");
  }

  report.status = assertOneOf(
    req.body.status || report.status,
    ["Investigating", "Escalated", "Queued", "Resolved", "Closed"],
    "Report status",
  );
  await report.save();

  res.json({
    success: true,
    message: "Report status updated successfully.",
    data: {
      reportId: report._id,
      id: report.code,
      target: report.target,
      reason: report.type,
      severity: report.severity,
      status: report.status,
      owner: report.owner,
      date: report.createdAt?.toISOString().slice(0, 10) || "Unknown",
    },
  });
});

export const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({}).populate("user").sort({ createdAt: -1 });

  res.json({
    success: true,
    data: transactions.map((transaction) => ({
      ...toTransactionRow(transaction),
      date: transaction.createdAt?.toISOString().slice(0, 10) || "Unknown",
    })),
  });
});

export const getWinners = asyncHandler(async (req, res) => {
  const orders = await Order.find({ status: { $in: ["Completed", "Paid", "Delivered", "Awaiting shipment", "In escrow"] } })
    .populate("seller bidder listing")
    .sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: orders.map((order) => ({
      orderId: order._id,
      id: order.code,
      product: order.item || order.listing?.title || "Unknown product",
      productCode: order.listing?.code || "No listing code",
      bidder: order.bidder?.name || "Unknown bidder",
      bidderEmail: order.bidder?.email || "Not available",
      seller: order.seller?.name || "Unknown seller",
      sellerEmail: order.seller?.email || "Not available",
      amount: formatCurrency(order.amount),
      escrow: formatCurrency(order.escrowAmount || 0),
      status: order.status,
      closedAt: order.updatedAt?.toISOString().slice(0, 10) || "Unknown",
    })),
  });
});

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await AppSettings.findOne({ key: "marketplace-settings" });

  res.json({
    success: true,
    data: settings?.sections || [],
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const allowedSections = Array.isArray(req.body.sections) ? req.body.sections : [];
  const sanitizedSections = allowedSections.map((section) => ({
    ...pickAllowedKeys(section, ["title", "description", "items"]),
    items: Array.isArray(section.items) ? section.items.slice(0, 12) : [],
  }));

  const settings = await AppSettings.findOneAndUpdate(
    { key: "marketplace-settings" },
    {
      key: "marketplace-settings",
      sections: sanitizedSections,
    },
    { upsert: true, new: true },
  );

  res.json({
    success: true,
    message: "Marketplace settings updated successfully.",
    data: settings.sections,
  });
});

export const getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user._id);

  res.json({
    success: true,
    data: serializeUser(admin),
  });
});
