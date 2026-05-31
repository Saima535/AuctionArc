/**
 * Shapes dashboard-specific API responses for seller, bidder, and admin views.
 */
import { AppSettings } from "../models/AppSettings.js";
import { Auction } from "../models/Auction.js";
import { Bid } from "../models/Bid.js";
import { Listing } from "../models/Listing.js";
import { Order } from "../models/Order.js";
import { Report } from "../models/Report.js";
import { Thread } from "../models/Thread.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import {
  buildActiveAuctionFilter,
  deriveAuctionLifecycleLabel,
  isAuctionActive,
} from "../services/auctionQueryService.js";
import { createNotification } from "../services/notificationService.js";
import { finalizeExpiredAuctions } from "../services/auctionSettlementService.js";
import { buildAdminInsights } from "../services/adminReportingService.js";
import { getOrderFinancials } from "../services/commissionService.js";
import {
  getPayoutTransactionsByOrderIds,
  releaseEligibleSellerPayouts,
  releaseSellerPayoutForOrder,
} from "../services/payoutService.js";
import {
  compactAmount,
  normalizeUserStatus,
  toAuctionRow,
  toBidRow,
  toListingCard,
  toStats,
  toThreadRow,
  toTransactionRow,
} from "../services/mapperService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { formatAuctionDuration } from "../utils/auctionDuration.js";
import { formatCurrency } from "../utils/formatters.js";
import { buildReportPdf } from "../services/adminReportingService.js";

// Buyer dashboard rows combine listing merchandising, auction timing, and
// user-specific interaction state in one frontend-ready object.
function buildAuctionWindow(startAt, endAt, fallbackValue = 5, fallbackUnit = "day") {
  // When both timestamps exist we derive the displayed duration from the actual
  // scheduled window instead of the listing’s original fallback settings.
  if (startAt && endAt) {
    const diffMs = endAt.getTime() - startAt.getTime();
    const diffMinutes = Math.max(Math.round(diffMs / (60 * 1000)), 1);

    if (diffMinutes < 1440) {
      return `${formatAuctionDuration(diffMinutes, "minute")} auction`;
    }

    const diffDays = Math.max(Math.round(diffMs / (24 * 60 * 60 * 1000)), 1);
    return `${formatAuctionDuration(diffDays, "day")} auction`;
  }

  return `${formatAuctionDuration(fallbackValue, fallbackUnit)} auction`;
}

function buildBuyerAuctionRow({ auction, listing }) {
  // Buyer cards expose both auction participation and instant-purchase options.
  const now = new Date();
  const isBiddable = isAuctionActive(auction, now);
  const isBuyNowAvailable = Number(listing.buyNowPrice || 0) > 0 && !["Closed"].includes(auction.status);
  const currentAmount = auction.currentBid || listing.currentBid || listing.price || 0;
  const startingAmount = listing.price || 0;
  const lifecycleLabel = deriveAuctionLifecycleLabel(auction, now);

  return {
    auctionId: auction._id,
    listingId: listing._id,
    id: listing.code,
    auctionCode: auction.code,
    title: listing.title || auction.title,
    description: listing.description || "",
    category: listing.category || auction.category || "Uncategorized",
    stage: lifecycleLabel,
    status: auction.status,
    seller: auction.seller?.name || listing.seller?.name || "AuctionArc seller",
    sellerId: auction.seller?._id || listing.seller?._id || null,
    currentBid: formatCurrency(currentAmount),
    // Buy now is intentionally formatted separately from current bid so the UI
    // can present the instant-purchase premium clearly.
    buyNowPrice: listing.buyNowPrice ? formatCurrency(listing.buyNowPrice) : "",
    price: formatCurrency(currentAmount),
    startingPrice: formatCurrency(startingAmount),
    priceLabel: currentAmount > startingAmount ? "Current bid" : "Starting price",
    auctionWindow: buildAuctionWindow(
      auction.startAt,
      auction.endAt,
      listing.auctionDurationDays || 5,
      listing.auctionDurationUnit || "day",
    ),
    bids: String(auction.bidCount || listing.bidCount || 0),
    condition: listing.condition || "Good",
    delivery: listing.deliveryOption || "AuctionArc Delivery",
    imageUrl: listing.images?.[0]?.url || "",
    images: (listing.images || []).map((image) => image?.url).filter(Boolean),
    premiumHighlight: Boolean(auction.featured || listing.premiumHighlight || listing.status === "Featured"),
    startAt: auction.startAt || null,
    endAt: auction.endAt || null,
    canBid: isBiddable,
    // Buy now remains available while the auction is still open and the seller
    // has configured a valid instant-purchase price.
    canBuyNow: isBuyNowAvailable,
  };
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function getSellerReportWindow(range = "weekly") {
  const normalizedRange = ["weekly", "monthly", "yearly"].includes(range) ? range : "weekly";
  const days = normalizedRange === "yearly" ? 365 : normalizedRange === "monthly" ? 30 : 7;
  const currentEnd = endOfDay(new Date());
  const currentStart = startOfDay(addDays(currentEnd, -(days - 1)));
  const previousEnd = endOfDay(addDays(currentStart, -1));
  const previousStart = startOfDay(addDays(previousEnd, -(days - 1)));

  return {
    key: normalizedRange,
    label:
      normalizedRange === "yearly"
        ? "Yearly report"
        : normalizedRange === "monthly"
          ? "Monthly report"
          : "Weekly report",
    days,
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
  };
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function formatSellerDelta(current, previous, suffix = "") {
  if (!previous) {
    return "No prior data";
  }

  const change = ((current - previous) / previous) * 100;
  const rounded = Math.abs(change).toFixed(1);
  const direction = change >= 0 ? "+" : "-";
  return `${direction}${rounded}%${suffix}`;
}

function buildSellerTrendPoints({ orders, bids, listings, start, days }) {
  return Array.from({ length: days }, (_, index) => {
    const day = addDays(start, index);
    const dayStart = startOfDay(day).getTime();
    const dayEnd = endOfDay(day).getTime();
    const label = days > 60
      ? new Intl.DateTimeFormat("en-US", { month: "short" }).format(day)
      : formatShortDate(day);

    const revenue = orders
      .filter((order) => {
        const createdAt = new Date(order.createdAt).getTime();
        return createdAt >= dayStart && createdAt <= dayEnd;
      })
      .reduce((sum, order) => sum + getOrderFinancials(order).sellerPayoutAmount, 0);
    const bidCount = bids.filter((bid) => {
      const createdAt = new Date(bid.createdAt).getTime();
      return createdAt >= dayStart && createdAt <= dayEnd;
    }).length;
    const listingCount = listings.filter((listing) => {
      const createdAt = new Date(listing.createdAt).getTime();
      return createdAt >= dayStart && createdAt <= dayEnd;
    }).length;

    return {
      label,
      revenue,
      bids: bidCount,
      listings: listingCount,
    };
  });
}

async function buildSellerReport({ sellerId, range = "weekly" }) {
  const window = getSellerReportWindow(range);
  const auctionIds = await Auction.find({ seller: sellerId }).distinct("_id");
  const currentQuery = {
    seller: sellerId,
    createdAt: { $gte: window.currentStart, $lte: window.currentEnd },
  };
  const previousQuery = {
    seller: sellerId,
    createdAt: { $gte: window.previousStart, $lte: window.previousEnd },
  };

  const [
    listings,
    previousListings,
    auctions,
    bids,
    orders,
    previousOrders,
  ] = await Promise.all([
    Listing.find(currentQuery).lean(),
    Listing.find(previousQuery).lean(),
    Auction.find(currentQuery).lean(),
    Bid.find({
      createdAt: { $gte: window.currentStart, $lte: window.currentEnd },
      auction: { $in: auctionIds },
    }).lean(),
    Order.find(currentQuery).lean(),
    Order.find(previousQuery).lean(),
  ]);

  const previousRevenue = previousOrders.reduce((sum, order) => sum + getOrderFinancials(order).sellerPayoutAmount, 0);
  const currentRevenue = orders.reduce((sum, order) => sum + getOrderFinancials(order).sellerPayoutAmount, 0);
  const currentCommission = orders.reduce((sum, order) => sum + getOrderFinancials(order).commissionAmount, 0);
  const previousCommission = previousOrders.reduce((sum, order) => sum + getOrderFinancials(order).commissionAmount, 0);
  const soldOrders = orders.filter((order) => ["Paid", "Awaiting shipment", "Delivered", "Completed"].includes(order.status)).length;
  const previousSoldOrders = previousOrders.filter((order) => ["Paid", "Awaiting shipment", "Delivered", "Completed"].includes(order.status)).length;
  const conversionRate = listings.length ? (orders.length / listings.length) * 100 : 0;
  const previousConversionRate = previousListings.length ? (previousOrders.length / previousListings.length) * 100 : 0;
  const averageBidValue = bids.length
    ? bids.reduce((sum, bid) => sum + (bid.amount || 0), 0) / bids.length
    : 0;
  const trend = buildSellerTrendPoints({
    orders,
    bids,
    listings,
    start: window.currentStart,
    days: window.days,
  });

  return {
    key: window.key,
    title: window.label,
    generatedAt: new Date().toISOString(),
    periodLabel: `${formatLongDate(window.currentStart)} to ${formatLongDate(window.currentEnd)}`,
    summaryCards: [
      {
        label: "Net revenue",
        value: formatCurrency(currentRevenue),
        delta: formatSellerDelta(currentRevenue, previousRevenue),
        tone: currentRevenue >= previousRevenue ? "good" : "warn",
      },
      {
        label: "Orders closed",
        value: String(soldOrders),
        delta: formatSellerDelta(soldOrders, previousSoldOrders),
        tone: soldOrders >= previousSoldOrders ? "good" : "warn",
      },
      {
        label: "Commission paid",
        value: formatCurrency(currentCommission),
        delta: formatSellerDelta(currentCommission, previousCommission),
        tone: currentCommission <= previousCommission ? "good" : "warn",
      },
      {
        label: "Conversion rate",
        value: `${Math.round(conversionRate)}%`,
        delta: formatSellerDelta(conversionRate, previousConversionRate),
        tone: conversionRate >= previousConversionRate ? "good" : "warn",
      },
    ],
    sections: [
      {
        title: "Selling performance",
        description: "A focused summary of listing, bidding, and order activity for the selected reporting window.",
        rows: [
          { label: "Listings created", value: String(listings.length), detail: `${auctions.length} auctions launched` },
          { label: "Bids received", value: compactAmount(bids.length), detail: `${formatCurrency(averageBidValue)} average bid` },
          { label: "Orders won", value: String(orders.length), detail: `${formatCurrency(currentRevenue)} seller payout after commission` },
          { label: "Commission charged", value: formatCurrency(currentCommission), detail: "5% platform fee across won products" },
          { label: "Completed pipeline", value: `${Math.round(conversionRate)}%`, detail: "Orders converted from created listings" },
        ],
      },
    ],
    trend,
  };
}

export const getSellerOverview = asyncHandler(async (req, res) => {
  // Refresh settlement first so overview KPIs include auctions that just ended.
  await finalizeExpiredAuctions({ seller: req.user._id });

  const [listings, auctions, orders] = await Promise.all([
    Listing.find({ seller: req.user._id }).sort({ updatedAt: -1 }).limit(6),
    Auction.find({ seller: req.user._id }).sort({ updatedAt: -1 }).limit(6),
    Order.find({ seller: req.user._id }).sort({ updatedAt: -1 }).limit(4),
  ]);

  const netSales = orders.reduce((sum, order) => sum + getOrderFinancials(order).sellerPayoutAmount, 0);
  // derive live / active auction count from Auction documents, not Listing.status
  const activeAuctionCount = await Auction.countDocuments({
    seller: req.user._id,
    ...buildActiveAuctionFilter(),
  });
  const totalBids = auctions.reduce((sum, auction) => sum + (auction.bidCount || 0), 0);
  const averageOrderValue = orders.length ? netSales / orders.length : 0;
  const conversionRate = listings.length ? Math.round((orders.length / listings.length) * 100) : 0;
  res.json({
    success: true,
    data: {
      // KPI cards summarize top-level seller performance and order activity.
      kpis: [
        toStats(
          "Live listings",
          String(activeAuctionCount),
          `${listings.length} total listings`,
          "good",
        ),
        toStats("Net sales", formatCurrency(netSales), "After 5% commission", "good"),
      ],
      // Secondary metrics capture traffic and commercial quality signals.
      performance: [
        toStats("Average order value", formatCurrency(averageOrderValue), `${orders.length} completed orders`, "good"),
        toStats("Conversion rate", `${conversionRate}%`, `${orders.length} orders won`, conversionRate >= 50 ? "good" : "warn"),
      ],
      auctionSummary: auctions.map((auction) => ({
        auctionId: auction._id,
        id: auction.code,
        title: auction.title,
        status: deriveAuctionLifecycleLabel(auction),
        currentBid: formatCurrency(auction.currentBid || 0),
        bidCount: String(auction.bidCount || 0),
        startAt: auction.startAt || null,
        endAt: auction.endAt || null,
      })),
    },
  });
});

export const getSellerReport = asyncHandler(async (req, res) => {
  const report = await buildSellerReport({
    sellerId: req.user._id,
    range: String(req.query.range || "weekly").toLowerCase(),
  });

  res.json({
    success: true,
    data: report,
  });
});

export const exportSellerReport = asyncHandler(async (req, res) => {
  const range = String(req.query.range || "weekly").toLowerCase();
  const report = await buildSellerReport({
    sellerId: req.user._id,
    range,
  });
  const stamp = new Date().toISOString().slice(0, 10);
  const baseName = `auctionarc-seller-${report.key}-report-${stamp}`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${baseName}.pdf"`);
  res.send(
    buildReportPdf({
      ...report,
      topPerformers: {
        sellers: [],
        categories: [],
      },
    }),
  );
});

export const getBidderOverview = asyncHandler(async (req, res) => {
  // Bidder overview focuses on bidding outcomes, won orders, and conversations.
  await finalizeExpiredAuctions();

  const [bids, orders, threads] = await Promise.all([
    Bid.find({ bidder: req.user._id }).populate("auction"),
    Order.find({ bidder: req.user._id }).populate("seller"),
    Thread.find({ "participants.user": req.user._id }).sort({ updatedAt: -1 }).limit(2),
  ]);

  res.json({
    success: true,
    data: {
      kpis: [
        toStats("Active bids", String(bids.length), "+4 today", "good"),
        toStats("Auctions won", String(orders.length), "+2 this month", "good"),
        toStats("Open conversations", String(threads.length), `${orders.length} won orders`, threads.length ? "warn" : "neutral"),
      ],
      activity: bids.slice(0, 3).map((bid) => ({
        title: bid.status === "Outbid" ? "Outbid alert" : "Bid activity",
        meta: `${bid.auction?.title || "Auction"} is currently ${bid.status.toLowerCase()}`,
      })),
      messages: threads.map((thread) => ({
        title: thread.subject,
        meta: thread.messages.at(-1)?.body || "No recent message",
      })),
    },
  });
});

export const getAdminOverview = asyncHandler(async (req, res) => {
  // This endpoint feeds both marketplace KPI cards and the admin operations queue.
  await finalizeExpiredAuctions();

  const [users, auctions, bids, listings, threads] = await Promise.all([
    User.find({ role: { $in: ["Seller", "Bidder"] } }).sort({ createdAt: -1 }).limit(4),
    Auction.find({}).sort({ updatedAt: -1 }).limit(4),
    Bid.find({}).sort({ createdAt: -1 }).populate("auction bidder").limit(4),
    Listing.find({}),
    Thread.find({}).sort({ updatedAt: -1 }).limit(3),
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const bidVolumeToday = await Bid.aggregate([
    {
      $match: {
        createdAt: { $gte: todayStart },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  const categoryCounter = new Map();
  for (const listing of listings) {
    categoryCounter.set(listing.category, (categoryCounter.get(listing.category) || 0) + 1);
  }

  const categories = [...categoryCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));

  const [
    liveAuctions,
    pendingAuctions,
    closedAuctions,
    packageTransactions,
    bidTransactions,
    soldTransactions,
    pendingListings
  ] = await Promise.all([
    Auction.countDocuments(buildActiveAuctionFilter()),
    Auction.countDocuments({ status: { $in: ["Scheduled", "Under review", "Paused"] } }),
    Auction.countDocuments({ status: "Closed" }),
    Transaction.countDocuments({ type: /package|registration/i }),
    Bid.countDocuments({}),
    Order.countDocuments({ status: { $in: ["Completed", "Paid", "Delivered"] } }),
    Listing.countDocuments({ status: { $in: ["Pending approval", "Pending review"] } }),
  ]);

  res.json({
    success: true,
    data: {
      // Dashboard summary powers the compact admin overview tiles.
      dashboardSummary: {
        auctions: {
          live: liveAuctions,
          pending: pendingAuctions + pendingListings,
          closed: closedAuctions,
        },
        transactions: {
          packages: packageTransactions,
          bids: bidTransactions,
          sold: soldTransactions,
        },
        pendingListings: pendingListings, // Optional: expose separately if needed
      },
      kpis: [
        toStats(
          "Active auctions",
          String(await Auction.countDocuments(buildActiveAuctionFilter())),
          "+12%",
          "good",
        ),
        toStats(
          "Verified sellers",
          compactAmount(await User.countDocuments({ role: "Seller", status: "Active" })),
          "+8.4%",
          "good",
        ),
        toStats("Bid volume today", formatCurrency(bidVolumeToday[0]?.total || 0), "+16.1%", "good"),
        toStats(
          "Open disputes",
          String(await Report.countDocuments({ status: { $in: ["Investigating", "Escalated", "Queued"] } })),
          "-3 cases",
          "warn",
        ),
      ],
      alerts: [
        {
          title: "Suspicious bid cluster",
          body: `${await Bid.countDocuments({ status: { $in: ["Held", "Review", "Pending check"] } })} bids require fraud review.`,
          level: "high",
        },
        {
          title: "Support backlog rising",
          body: `${await Thread.countDocuments({ status: { $in: ["Open", "Support active", "Escalated"] } })} active conversations need follow-up.`,
          level: "medium",
        },
        {
          title: "Seller activity snapshot",
          body: `${await User.countDocuments({ role: "Seller", status: "Active" })} sellers are active on the platform.`,
          level: "low",
        },
      ],
      activity: auctions.map((auction) => ({
        title: `${auction.title} status changed`,
        meta: `${deriveAuctionLifecycleLabel(auction)} auction updated ${auction.updatedAt.toISOString().slice(0, 10)}`,
      })),
      categories,
      registrations: users.slice(0, 3).map((user) => ({
        name: user.name,
        role: user.role,
        country: user.country,
        status: normalizeUserStatus(user.status),
      })),
      supportQueue: [
        {
          queue: "Disputes",
          open: String(await Report.countDocuments({ type: "Bid dispute" })).padStart(2, "0"),
          sla: "1h 10m",
          status: "Attention needed",
        },
        {
          queue: "Payments",
          open: String(await Thread.countDocuments({ subject: /payment/i })).padStart(2, "0"),
          sla: "42m",
          status: "Healthy",
        },
        {
          queue: "Seller accounts",
          open: String(await User.countDocuments({ role: "Seller", status: "Active" })).padStart(2, "0"),
          sla: "Live",
          status: "Healthy",
        },
      ],
      recentThreads: threads.map(toThreadRow),
      recentBids: bids.map(toBidRow),
    },
  });
});

export const getAdminInsights = asyncHandler(async (req, res) => {
  // Insights combines analytics, transactions, reports, and configurable
  // settings into one richer admin reporting payload.
  const [insights, transactions, reports, settings] = await Promise.all([
    buildAdminInsights(req.query.period),
    Transaction.find({}).populate("user").sort({ createdAt: -1 }),
    Report.find({}).sort({ updatedAt: -1 }),
    AppSettings.findOne({ key: "marketplace-settings" }),
  ]);

  res.json({
    success: true,
    data: {
      ...insights,
      transactions: transactions.map(toTransactionRow),
      reports,
      settings: settings?.sections || [],
    },
  });
});

export const getSellerListings = asyncHandler(async (req, res) => {
  // Seller listing management merges base listing data with any linked auction
  // snapshot so the frontend can edit and review from one screen.
  await finalizeExpiredAuctions({ seller: req.user._id });

  const listings = await Listing.find({ seller: req.user._id }).sort({ updatedAt: -1 }).lean();
  const listingIds = listings.map((listing) => listing._id);
  const auctions = await Auction.find({ seller: req.user._id, listing: { $in: listingIds } })
    .sort({ updatedAt: -1 })
    .lean();
  const auctionByListingId = new Map(
    auctions.map((auction) => [String(auction.listing), auction]),
  );

  res.json({
    success: true,
    data: listings.map((listing) => {
      const auction = auctionByListingId.get(String(listing._id));

      return {
        listingId: listing._id,
        id: listing.code,
        title: listing.title,
        category: listing.category,
        description: listing.description || "",
        status: listing.status,
        condition: listing.condition || "Good",
        price: formatCurrency(listing.price || 0),
        currentBid: formatCurrency(listing.currentBid || listing.price || 0),
        bidCount: String(listing.bidCount || 0),
        auctionDurationDays: listing.auctionDurationDays || 0,
        auctionDurationUnit: listing.auctionDurationUnit || "day",
        delivery: listing.deliveryOption || "AuctionArc Delivery",
        deliveryFee: formatCurrency(listing.deliveryFee || 0),
        buyNowPrice: listing.buyNowPrice ? formatCurrency(listing.buyNowPrice) : "Not set",
        premiumHighlight: Boolean(listing.premiumHighlight || auction?.featured),
        imageUrl: listing.images?.[0]?.url || "",
        images: (listing.images || []).map((image) => image?.url).filter(Boolean),
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
        notes: listing.notes || [],
        auction: auction
          ? {
              auctionId: auction._id,
              code: auction.code,
              title: auction.title,
              status: auction.status,
              currentBid: formatCurrency(auction.currentBid || listing.currentBid || listing.price || 0),
              bidCount: String(auction.bidCount || listing.bidCount || 0),
              startAt: auction.startAt || null,
              endAt: auction.endAt || null,
            }
          : null,
      };
    }),
  });
});

export const getSellerAuctions = asyncHandler(async (req, res) => {
  await finalizeExpiredAuctions({ seller: req.user._id });

  // Seller auctions should include the seller's full auction activity table,
  // not just currently-live sessions.
  const auctions = await Auction.find({
    seller: req.user._id,
  }).sort({ updatedAt: -1 });
  const now = Date.now();

  res.json({
    success: true,
    data: auctions.map((auction) => ({
      id: auction.code,
      title: auction.title,
      stage: deriveAuctionLifecycleLabel(auction),
      currentBid: auction.currentBid ? formatCurrency(auction.currentBid) : "--",
      endAt: auction.endAt || null,
      ends: auction.endAt
        ? auction.endAt.getTime() <= now
          ? "Closed"
          : `${Math.max(Math.round((auction.endAt.getTime() - now) / 60000), 0)}m`
        : "Pending",
    })),
  });
});

export const getSellerOrders = asyncHandler(async (req, res) => {
  // Seller orders are the fulfilment queue after either auction settlement or buy now.
  await finalizeExpiredAuctions({ seller: req.user._id });
  await releaseEligibleSellerPayouts({ seller: req.user._id });

  const orders = await Order.find({ seller: req.user._id }).populate("bidder").sort({ updatedAt: -1 });
  const payoutTransactions = await getPayoutTransactionsByOrderIds(orders.map((order) => order._id));

  res.json({
    success: true,
    data: orders.map((order) => ({
      orderId: order._id,
      id: order.code,
      item: order.item,
      buyer: order.bidder?.name || "Unknown buyer",
      amount: formatCurrency(getOrderFinancials(order).sellerPayoutAmount),
      grossAmount: formatCurrency(order.amount),
      commission: formatCurrency(getOrderFinancials(order).commissionAmount),
      payoutAmount: formatCurrency(getOrderFinancials(order).sellerPayoutAmount),
      payoutStatus: payoutTransactions.get(String(order._id))?.status || (order.status === "Payment pending" ? "Awaiting payment" : "Pending payout"),
      payoutReleasedAt: order.payoutReleasedAt || null,
      status: order.status,
    })),
  });
});

export const getSellerAnalytics = asyncHandler(async (req, res) => {
  // Seller analytics derives simple trend arrays from listing, auction, and
  // order history without requiring a separate analytics warehouse.
  await finalizeExpiredAuctions({ seller: req.user._id });

  const [listings, auctions, orders] = await Promise.all([
    Listing.find({ seller: req.user._id }).sort({ createdAt: 1 }),
    Auction.find({ seller: req.user._id }).sort({ createdAt: 1 }),
    Order.find({ seller: req.user._id }).sort({ createdAt: 1 }),
  ]);

  const totalBids = auctions.reduce((sum, auction) => sum + (auction.bidCount || 0), 0);
  const conversionRate = listings.length ? Math.round((orders.length / listings.length) * 100) : 0;
  const dropOffRate = listings.length ? Math.max(0, 100 - conversionRate) : 0;

  const bidTrend = auctions.slice(-7).map((auction) => auction.bidCount || 0);
  const conversionTrend = listings.slice(-7).map((listing, index) => {
    const activeOrders = orders.slice(0, Math.min(index + 1, orders.length)).length;
    return activeOrders ? Math.round((activeOrders / Math.max(index + 1, 1)) * 100) : 0;
  });

  res.json({
    success: true,
    data: {
      kpis: [
        toStats("Bid engagement", compactAmount(totalBids), `${auctions.length} auctions`, "good"),
        toStats("Conversion rate", `${conversionRate}%`, `${orders.length} completed sales`, "good"),
        toStats("Drop-off risk", `${dropOffRate}%`, "Attention on idle listings", "warn"),
      ],
      series: {
        bids: bidTrend.length ? bidTrend : [0, 0, 0, 0, 0, 0, 0],
        conversion: conversionTrend.length ? conversionTrend : [0, 0, 0, 0, 0, 0, 0],
      },
    },
  });
});

export const getBidderDiscover = asyncHandler(async (req, res) => {
  // Buyer discovery returns flattened, card-ready rows that now include buy-now
  // pricing and availability.
  await finalizeExpiredAuctions();

  const auctions = await Auction.find(buildActiveAuctionFilter())
    .populate("listing")
    .populate("seller", "name")
    .sort({ featured: -1, updatedAt: -1 })
    .limit(24);
  const visibleAuctions = auctions.filter((auction) => auction.listing);

  res.json({
    success: true,
    data: visibleAuctions.map((auction) =>
      buildBuyerAuctionRow({
        auction,
        listing: auction.listing,
      }),
    ),
  });
});

export const getBidderBids = asyncHandler(async (req, res) => {
  // Bid rows are simplified for the bidder dashboard and bid history views.
  await finalizeExpiredAuctions();

  const bids = await Bid.find({ bidder: req.user._id }).populate("auction");

  res.json({
    success: true,
    data: bids.map((bid) => ({
      id: bid.code,
      auction: bid.auction?.title || "Unknown auction",
      yourBid: formatCurrency(bid.amount),
      standing: bid.status === "Top bid" ? "Leading" : bid.status === "Outbid" ? "2nd place" : "Review hold",
      status: bid.status,
    })),
  });
});

export const getBidderWins = asyncHandler(async (req, res) => {
  // Wins page is reused for both auction-win payments and buy-now purchases, so
  // it resolves the related auction id when available.
  await finalizeExpiredAuctions();

  const orders = await Order.find({ bidder: req.user._id }).populate("seller");
  const listingIds = orders.map((order) => order.listing).filter(Boolean);
  // Orders point at listings directly, so we recover auction ids here for wins UI.
  const auctions = await Auction.find({ listing: { $in: listingIds } }).select("_id listing");
  const auctionByListingId = new Map(
    auctions.map((auction) => [String(auction.listing), String(auction._id)]),
  );

  res.json({
    success: true,
    data: orders.map((order) => ({
      orderId: order._id,
      listingId: order.listing,
      auctionId: auctionByListingId.get(String(order.listing)) || null,
      id: order.code,
      item: order.item,
      seller: order.seller?.name || "Unknown seller",
      sellerId: order.seller?._id || null,
      amount: formatCurrency(order.amount),
      commission: formatCurrency(getOrderFinancials(order).commissionAmount),
      status: order.status,
      canPay: order.status === "Payment pending",
      paidAt: order.paidAt || null,
    })),
  });
});

export const getWatchlist = asyncHandler(async (req, res) => {
  // Watchlist is currently stubbed in this branch and returns an empty set.
  res.json({
    success: true,
    data: [],
  });
});

export const updateSellerOrderStatus = asyncHandler(async (req, res) => {
  // Sellers can only advance order fulfilment in a strict forward-only sequence.
  const { orderId } = req.params;
  const { status } = req.body;

  const order = await Order.findById(orderId).populate("seller bidder");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.seller._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only update your own orders");
  }

  // Sellers can only advance fulfilment one step at a time.
  const statusTransitions = {
    "Paid": "Awaiting shipment",
    "Awaiting shipment": "Delivered",
    "Delivered": "Completed",
  };
  const expectedNextStatus = statusTransitions[order.status];

  if (!expectedNextStatus || status !== expectedNextStatus) {
    throw new ApiError(400, "Invalid order status transition");
  }

  order.status = status;
  await order.save();
  await releaseSellerPayoutForOrder(order);

  if (order.bidder?._id) {
    await createNotification({
      userId: order.bidder._id,
      title: "Order status changed",
      body: `Your order for "${order.item}" is now ${order.status}.`,
      type: "order",
      href: "/bidder/wins",
      metadata: {
        orderId: order._id,
        status: order.status,
      },
    });
  }

  res.json({
    success: true,
    data: order,
  });
});
