import { AppSettings } from "../models/AppSettings.js";
import { Auction } from "../models/Auction.js";
import { Bid } from "../models/Bid.js";
import { Listing } from "../models/Listing.js";
import { Order } from "../models/Order.js";
import { Report } from "../models/Report.js";
import { Thread } from "../models/Thread.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { Watchlist } from "../models/Watchlist.js";
import { ApiError } from "../utils/apiError.js";
import {
  buildActiveAuctionFilter,
  buildWatchableAuctionFilter,
  deriveAuctionLifecycleLabel,
  isAuctionActive,
  isAuctionWatchable,
} from "../services/auctionQueryService.js";
import { createNotification } from "../services/notificationService.js";
import { finalizeExpiredAuctions } from "../services/auctionSettlementService.js";
import {
  compactAmount,
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

function buildAuctionWindow(startAt, endAt, fallbackValue = 5, fallbackUnit = "day") {
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

function buildBuyerAuctionRow({ auction, listing, watchlisted = false }) {
  const now = new Date();
  const isBiddable = isAuctionActive(auction, now);
  const isWatchable = isAuctionWatchable(auction, now);
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
    price: formatCurrency(currentAmount),
    startingPrice: formatCurrency(startingAmount),
    priceLabel: currentAmount > startingAmount ? "Current bid" : "Starting price",
    auctionWindow: buildAuctionWindow(
      auction.startAt,
      auction.endAt,
      listing.auctionDurationDays || 5,
      listing.auctionDurationUnit || "day",
    ),
    watchers: String(auction.watcherCount || listing.watcherCount || 0),
    bids: String(auction.bidCount || listing.bidCount || 0),
    condition: listing.condition || "Good",
    delivery: listing.deliveryOption || "AuctionArc Delivery",
    imageUrl: listing.images?.[0]?.url || "",
    images: (listing.images || []).map((image) => image?.url).filter(Boolean),
    premiumHighlight: Boolean(auction.featured || listing.premiumHighlight || listing.status === "Featured"),
    reserveStatus: auction.reserveStatus || listing.reserveStatus || "Pending",
    startAt: auction.startAt || null,
    endAt: auction.endAt || null,
    canBid: isBiddable,
    canWatch: isWatchable,
    watchlisted,
  };
}

export const getSellerOverview = asyncHandler(async (req, res) => {
  await finalizeExpiredAuctions({ seller: req.user._id });

  const [seller, listings, auctions, orders, threads, sellerAuctions] = await Promise.all([
    User.findById(req.user._id),
    Listing.find({ seller: req.user._id }).sort({ updatedAt: -1 }).limit(4),
    Auction.find({ seller: req.user._id }).sort({ updatedAt: -1 }).limit(4),
    Order.find({ seller: req.user._id }).sort({ updatedAt: -1 }).limit(4),
    Thread.find({ "participants.user": req.user._id }).sort({ updatedAt: -1 }).limit(2),
    Auction.find({ seller: req.user._id }).select("_id"),
  ]);

  const sellerBids = await Bid.find({
    auction: { $in: sellerAuctions.map((auction) => auction._id) },
  }).distinct("bidder");

  const grossSales = orders.reduce((sum, order) => sum + order.amount, 0);
  // derive live / active auction count from Auction documents, not Listing.status
  const activeAuctionCount = await Auction.countDocuments({
    seller: req.user._id,
    ...buildActiveAuctionFilter(),
  });
  const processingOrders = orders.filter((item) => item.status !== "Completed").length;
  const totalViews = listings.reduce((sum, listing) => sum + (listing.viewCount || 0), 0);
  const totalWatchers = auctions.reduce((sum, auction) => sum + (auction.watcherCount || 0), 0);
  const totalBids = auctions.reduce((sum, auction) => sum + (auction.bidCount || 0), 0);
  const conversionRate = listings.length ? Math.round((orders.length / listings.length) * 100) : 0;
  const locationQuery =
    seller?.location?.trim() || seller?.country?.trim() || "";
  const listingStatusGroups = [
    { label: "Live", value: listings.filter((item) => item.status === "Live").length },
    { label: "Featured", value: listings.filter((item) => item.status === "Featured").length },
    { label: "Pending approval", value: listings.filter((item) => item.status === "Pending approval").length },
    { label: "Draft", value: listings.filter((item) => item.status === "Draft").length },
  ];

  res.json({
    success: true,
    data: {
      kpis: [
        toStats(
          "Live listings",
          String(activeAuctionCount),
          `${listings.length} total listings`,
          "good",
        ),
        toStats("Active buyers", String(sellerBids.length), `${auctions.length} seller auctions`, "good"),
        toStats("Gross sales", formatCurrency(grossSales), `${orders.length} completed orders`, "good"),
        toStats(
          "Pending payouts",
          formatCurrency(req.user.wallet.pendingPayout || 0),
          `${processingOrders} orders in progress`,
          "warn",
        ),
      ],
      performance: [
        toStats("Listing views", compactAmount(totalViews), `${listings.length} listings tracked`, "good"),
        toStats("Watchers", compactAmount(totalWatchers), `${auctions.length} auction sessions`, "good"),
        toStats("Bid activity", compactAmount(totalBids), `${sellerBids.length} buyers engaged`, "good"),
        toStats("Conversion rate", `${conversionRate}%`, `${orders.length} orders won`, conversionRate >= 50 ? "good" : "warn"),
      ],
      activity: auctions.map((auction) => ({
        title: `${auction.title} updated`,
        meta: `${deriveAuctionLifecycleLabel(auction)} auction refreshed ${auction.updatedAt.toISOString().slice(0, 10)}`,
      })),
      auctionSummary: auctions.map((auction) => ({
        id: auction.code,
        title: auction.title,
        status: deriveAuctionLifecycleLabel(auction),
        currentBid: formatCurrency(auction.currentBid || 0),
        bidCount: String(auction.bidCount || 0),
        watchers: String(auction.watcherCount || 0),
        startAt: auction.startAt || null,
        endAt: auction.endAt || null,
      })),
      listingPipeline: listingStatusGroups,
      location: {
        label: locationQuery || "Location not added yet",
        query: locationQuery,
      },
      messages: threads.map((thread) => ({
        title: thread.subject,
        meta: thread.messages.at(-1)?.body || "No recent message",
      })),
      currentListings: listings.slice(0, 4).map((listing) => ({
        id: String(listing._id),
        code: listing.code,
        title: listing.title,
        description: listing.description || "No product summary has been added yet.",
        status: listing.status,
        currentBid: formatCurrency(listing.currentBid || listing.price || 0),
        watchers: String(
          auctions.find((auction) => String(auction.listing) === String(listing._id))?.watcherCount ||
            listing.watcherCount ||
            0,
        ),
        views: String(listing.viewCount || 0),
        delivery: listing.deliveryOption || "AuctionArc Delivery",
        endTime:
          auctions.find((auction) => String(auction.listing) === String(listing._id))?.endAt || null,
        imageUrl: listing.images?.[0]?.url || "",
        images: (listing.images || []).map((image) => image?.url).filter(Boolean),
        premiumHighlight: Boolean(listing.premiumHighlight || listing.status === "Featured"),
      })),
      salesHistory: orders.map((order) => ({
        id: order.code,
        title: order.item,
        price: formatCurrency(order.amount || 0),
        status: order.status,
      })),
    },
  });
});

export const getBidderOverview = asyncHandler(async (req, res) => {
  await finalizeExpiredAuctions();

  const [bids, watchlist, orders, threads] = await Promise.all([
    Bid.find({ bidder: req.user._id }).populate("auction"),
    Watchlist.find({ user: req.user._id }).populate("auction"),
    Order.find({ bidder: req.user._id }).populate("seller"),
    Thread.find({ "participants.user": req.user._id }).sort({ updatedAt: -1 }).limit(2),
  ]);

  res.json({
    success: true,
    data: {
      kpis: [
        toStats("Active bids", String(bids.length), "+4 today", "good"),
        toStats("Watchlist items", String(watchlist.length), "+6 this week", "good"),
        toStats("Auctions won", String(orders.length), "+2 this month", "good"),
        toStats("Funds on hold", formatCurrency(req.user.wallet.heldBalance || 0), `${watchlist.length} auctions`, "warn"),
      ],
      activity: bids.slice(0, 3).map((bid) => ({
        title: bid.status === "Outbid" ? "Outbid alert" : "Bid activity",
        meta: `${bid.auction?.title || "Auction"} is currently ${bid.status.toLowerCase()}`,
      })),
      watchlist: watchlist.slice(0, 3).map((item) => ({
        id: item.auction?.code,
        title: item.auction?.title,
        status: item.auction ? deriveAuctionLifecycleLabel(item.auction) : "Unavailable",
        currentBid: item.auction?.currentBid ? formatCurrency(item.auction.currentBid) : "--",
        seller: "AuctionArc seller",
      })),
      messages: threads.map((thread) => ({
        title: thread.subject,
        meta: thread.messages.at(-1)?.body || "No recent message",
      })),
    },
  });
});

export const getAdminOverview = asyncHandler(async (req, res) => {
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
          title: "Pending verification wave",
          body: `${await User.countDocuments({ role: "Seller", status: "Pending verification" })} sellers are waiting for review.`,
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
        status: user.status,
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
          queue: "Account reviews",
          open: String(await User.countDocuments({ status: "Pending verification" })).padStart(2, "0"),
          sla: "2h 05m",
          status: "Busy",
        },
      ],
      recentThreads: threads.map(toThreadRow),
      recentBids: bids.map(toBidRow),
    },
  });
});

export const getAdminInsights = asyncHandler(async (req, res) => {
  const [transactions, listings, reports, settings] = await Promise.all([
    Transaction.find({}).populate("user").sort({ createdAt: -1 }),
    Listing.find({}).populate("seller"),
    Report.find({}).sort({ updatedAt: -1 }),
    AppSettings.findOne({ key: "marketplace-settings" }),
  ]);

  res.json({
    success: true,
    data: {
      insightSeries: {
        marketplaceGrowth: [28, 35, 34, 41, 50, 57, 63],
        bidVolume: [44, 39, 55, 71, 66, 74, 82],
        conversion: [18, 22, 20, 29, 33, 35, 38],
        fraudSignals: [12, 10, 14, 9, 8, 7, 6],
      },
      insightCards: [
        toStats(
          "Gross marketplace activity",
          formatCurrency(transactions.reduce((sum, item) => sum + item.amount, 0)),
          "+14.2%",
          "good",
        ),
        toStats("Average auction completion", "73%", "+4.1%", "good"),
        toStats("Fraud review rate", "1.8%", "-0.4%", "good"),
        toStats("Support resolution time", "46m", "+6m", "warn"),
      ],
      topPerformers: {
        sellers: (await User.find({ role: "Seller" }).sort({ "wallet.availableBalance": -1 }).limit(3)).map((user) => ({
          name: user.name,
          metric: `${formatCurrency(user.wallet.availableBalance || 0)} volume`,
          status: user.status === "Active" ? "Top seller" : "Rising",
        })),
        categories: [
          { name: "Vehicles", metric: "28% share", status: "Leading" },
          { name: "Luxury goods", metric: "21% share", status: "Growing" },
          { name: "Electronics", metric: "18% share", status: "Stable" },
        ],
        products: listings.slice(0, 3).map((listing) => ({
          name: listing.title,
          metric: `${listing.bidCount} bids`,
          status: listing.status,
        })),
      },
      transactions: transactions.map(toTransactionRow),
      reports,
      settings: settings?.sections || [],
    },
  });
});

export const getSellerListings = asyncHandler(async (req, res) => {
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
        reserveStatus: listing.reserveStatus || "Pending",
        condition: listing.condition || "Good",
        price: formatCurrency(listing.price || 0),
        currentBid: formatCurrency(listing.currentBid || listing.price || 0),
        bidCount: String(listing.bidCount || 0),
        watchers: String(
          auction?.watcherCount ?? listing.watcherCount ?? 0,
        ),
        views: String(listing.viewCount || 0),
        auctionDurationDays: listing.auctionDurationDays || 0,
        auctionDurationUnit: listing.auctionDurationUnit || "day",
        delivery: listing.deliveryOption || "AuctionArc Delivery",
        deliveryFee: formatCurrency(listing.deliveryFee || 0),
        reservePrice: formatCurrency(listing.reservePrice || 0),
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
              reserveStatus: auction.reserveStatus || "Pending",
              currentBid: formatCurrency(auction.currentBid || listing.currentBid || listing.price || 0),
              bidCount: String(auction.bidCount || listing.bidCount || 0),
              watcherCount: String(auction.watcherCount || listing.watcherCount || 0),
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

  // Only show LIVE auctions for the seller (not Scheduled, not Closed)
  const auctions = await Auction.find({
    seller: req.user._id,
    status: "Live", // Only show live auctions
    endAt: { $gt: new Date() }, // Must have future end date
  }).sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: auctions.map((auction) => ({
      id: auction.code,
      title: auction.title,
      stage: deriveAuctionLifecycleLabel(auction),
      currentBid: auction.currentBid ? formatCurrency(auction.currentBid) : "--",
      watchers: String(auction.watcherCount || 0),
      endAt: auction.endAt || null,
      ends: auction.endAt ? `${Math.max(Math.round((auction.endAt.getTime() - Date.now()) / 60000), 0)}m` : "Pending",
    })),
  });
});

export const getSellerOrders = asyncHandler(async (req, res) => {
  await finalizeExpiredAuctions({ seller: req.user._id });

  const orders = await Order.find({ seller: req.user._id }).populate("bidder").sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: orders.map((order) => ({
      orderId: order._id,
      id: order.code,
      item: order.item,
      buyer: order.bidder?.name || "Unknown buyer",
      amount: formatCurrency(order.amount),
      status: order.status,
    })),
  });
});

export const getSellerAnalytics = asyncHandler(async (req, res) => {
  await finalizeExpiredAuctions({ seller: req.user._id });

  const [listings, auctions, orders] = await Promise.all([
    Listing.find({ seller: req.user._id }).sort({ createdAt: 1 }),
    Auction.find({ seller: req.user._id }).sort({ createdAt: 1 }),
    Order.find({ seller: req.user._id }).sort({ createdAt: 1 }),
  ]);

  const totalViews = listings.reduce((sum, listing) => sum + (listing.viewCount || 0), 0);
  const totalBids = auctions.reduce((sum, auction) => sum + (auction.bidCount || 0), 0);
  const conversionRate = listings.length ? Math.round((orders.length / listings.length) * 100) : 0;
  const dropOffRate = listings.length ? Math.max(0, 100 - conversionRate) : 0;

  const viewsTrend = listings.slice(-7).map((listing) => listing.viewCount || 0);
  const bidTrend = auctions.slice(-7).map((auction) => auction.bidCount || 0);
  const conversionTrend = listings.slice(-7).map((listing, index) => {
    const activeOrders = orders.slice(0, Math.min(index + 1, orders.length)).length;
    return activeOrders ? Math.round((activeOrders / Math.max(index + 1, 1)) * 100) : 0;
  });

  res.json({
    success: true,
    data: {
      kpis: [
        toStats("Listing views", compactAmount(totalViews), `Across ${listings.length} listings`, "good"),
        toStats("Bid engagement", compactAmount(totalBids), `${auctions.length} auctions`, "good"),
        toStats("Conversion rate", `${conversionRate}%`, `${orders.length} completed sales`, "good"),
        toStats("Drop-off risk", `${dropOffRate}%`, "Attention on idle listings", "warn"),
      ],
      series: {
        views: viewsTrend.length ? viewsTrend : [0, 0, 0, 0, 0, 0, 0],
        bids: bidTrend.length ? bidTrend : [0, 0, 0, 0, 0, 0, 0],
        conversion: conversionTrend.length ? conversionTrend : [0, 0, 0, 0, 0, 0, 0],
      },
    },
  });
});

export const getBidderDiscover = asyncHandler(async (req, res) => {
  await finalizeExpiredAuctions();

  const [auctions, watchlist] = await Promise.all([
    Auction.find(buildActiveAuctionFilter())
      .populate("listing")
      .populate("seller", "name")
      .sort({ featured: -1, updatedAt: -1 })
      .limit(24),
    Watchlist.find({ user: req.user._id }).select("auction").lean(),
  ]);
  const watchlistIds = new Set(watchlist.map((item) => String(item.auction)));
  const visibleAuctions = auctions.filter((auction) => auction.listing);

  res.json({
    success: true,
    data: visibleAuctions.map((auction) =>
      buildBuyerAuctionRow({
        auction,
        listing: auction.listing,
        watchlisted: watchlistIds.has(String(auction._id)),
      }),
    ),
  });
});

export const getBidderBids = asyncHandler(async (req, res) => {
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
  await finalizeExpiredAuctions();

  const orders = await Order.find({ bidder: req.user._id }).populate("seller");

  res.json({
    success: true,
    data: orders.map((order) => ({
      orderId: order._id,
      id: order.code,
      item: order.item,
      seller: order.seller?.name || "Unknown seller",
      sellerId: order.seller?._id || null,
      amount: formatCurrency(order.amount),
      status: order.status,
    })),
  });
});

export const getWatchlist = asyncHandler(async (req, res) => {
  await finalizeExpiredAuctions();

  const watchlist = await Watchlist.find({ user: req.user._id })
    .populate({
      path: "auction",
      populate: [
        { path: "listing" },
        { path: "seller", select: "name" },
      ],
    });

  res.json({
    success: true,
    data: watchlist
      .filter((item) => item.auction?.listing)
      .map((item) => {
        const row = buildBuyerAuctionRow({
          auction: item.auction,
          listing: item.auction.listing,
          watchlisted: true,
        });

        return {
          auctionId: row.auctionId,
          listingId: row.listingId,
          id: row.auctionCode,
          title: row.title,
          seller: row.seller,
          sellerId: row.sellerId,
          currentBid: row.currentBid,
          status: row.stage,
          endAt: row.endAt,
        };
      }),
  });
});

export const getWalletOverview = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }).populate("user");

  res.json({
    success: true,
    data: {
      stats: [
        toStats("Available balance", formatCurrency(req.user.wallet.availableBalance || 0), `+${formatCurrency(3200)}`, "good"),
        toStats("Pending payout", formatCurrency(req.user.wallet.pendingPayout || 0), "2 orders", "warn"),
        toStats("Funds on hold", formatCurrency(req.user.wallet.heldBalance || 0), "3 auctions", "warn"),
        toStats("Platform fees", formatCurrency(req.user.wallet.platformFees || 0), "This month", "neutral"),
      ],
      transactions: transactions.map(toTransactionRow),
    },
  });
});

export const updateSellerOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const order = await Order.findById(orderId).populate("seller bidder");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.seller._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only update your own orders");
  }

  const validStatuses = ["Awaiting payout", "Completed", "In escrow", "Awaiting shipment", "Paid", "Delivered"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  order.status = status;
  await order.save();

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
