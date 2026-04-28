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
import {
  compactAmount,
  toAuctionRow,
  toBidRow,
  toDiscoverRow,
  toListingCard,
  toStats,
  toThreadRow,
  toTransactionRow,
} from "../services/mapperService.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { formatCurrency } from "../utils/formatters.js";

export const getSellerOverview = asyncHandler(async (req, res) => {
  const [listings, auctions, orders, threads, sellerAuctions] = await Promise.all([
    Listing.find({ seller: req.user._id }).sort({ updatedAt: -1 }).limit(8),
    Auction.find({ seller: req.user._id }).sort({ updatedAt: -1 }).limit(6),
    Order.find({ seller: req.user._id }).sort({ updatedAt: -1 }),
    Thread.find({ "participants.user": req.user._id }).sort({ updatedAt: -1 }).limit(5),
    Auction.find({ seller: req.user._id }).select("_id"),
  ]);

  const sellerBids = await Bid.find({
    auction: { $in: sellerAuctions.map((auction) => auction._id) },
  }).distinct("bidder");

  const grossSales = orders.reduce((sum, order) => sum + order.amount, 0);
  const totalViews = listings.reduce((sum, listing) => sum + (listing.viewCount || 0), 0);
  const totalWatchers = listings.reduce((sum, listing) => sum + (listing.watcherCount || 0), 0);
  const pendingOrders = orders.filter((item) => !["Completed", "Delivered"].includes(item.status)).length;
  const conversionRate = listings.length ? Math.round((orders.length / listings.length) * 100) : 0;
  const activeAuctions = auctions.filter((item) => ["Live", "Extended"].includes(item.status));
  const currentListings = listings
    .filter((listing) => ["Live", "Featured", "Pending approval", "Pending review", "Draft"].includes(listing.status))
    .slice(0, 4)
    .map((listing) => {
      const relatedAuction = auctions.find((auction) => String(auction.listing) === String(listing._id));

      return {
        id: listing._id,
        code: listing.code,
        title: listing.title,
        description: listing.description,
        currentBid: formatCurrency(listing.currentBid || listing.price || 0),
        endTime: relatedAuction?.endAt ? relatedAuction.endAt.toISOString() : null,
        delivery: listing.deliveryOption || "AuctionArc Delivery",
        views: String(listing.viewCount || 0),
        watchers: String(listing.watcherCount || 0),
        status: listing.status,
      };
    });
  const salesHistory = orders
    .filter((item) => ["Completed", "Paid", "Delivered"].includes(item.status))
    .slice(0, 4)
    .map((order) => ({
      id: order.code,
      title: order.item,
      price: formatCurrency(order.amount),
      status: order.status,
    }));

  res.json({
    success: true,
    data: {
      kpis: [
        toStats(
          "Live listings",
          String(listings.filter((item) => ["Live", "Featured"].includes(item.status)).length),
          `+${Math.max(listings.length - 1, 0)} this week`,
          "good",
        ),
        toStats("Active bidders", String(sellerBids.length), "+18%", "good"),
        toStats("Gross sales", formatCurrency(grossSales), "+12.4%", "good"),
        toStats(
          "Pending payouts",
          formatCurrency(req.user.wallet.pendingPayout || 0),
          `${orders.filter((item) => item.status !== "Completed").length} processing`,
          "warn",
        ),
      ],
      performance: [
        toStats("Listing views", compactAmount(totalViews), "Across your storefront", "good"),
        toStats("Watchers", compactAmount(totalWatchers), "Live bidder attention", "good"),
        toStats("Pending orders", String(pendingOrders), "Needs delivery follow-up", pendingOrders ? "warn" : "good"),
        toStats("Conversion", `${conversionRate}%`, `${orders.length} order outcomes`, "good"),
      ],
      activity: auctions.map((auction) => ({
        title: `${auction.title} updated`,
        meta: `${auction.status} auction refreshed ${auction.updatedAt.toISOString().slice(0, 10)}`,
      })),
      spotlight: {
        greeting: `Welcome back, ${req.user.name.split(" ")[0]}!`,
        message: `You have ${sellerBids.length} active bidder${sellerBids.length === 1 ? "" : "s"} across ${activeAuctions.length} auction${activeAuctions.length === 1 ? "" : "s"}.`,
      },
      listings: listings.slice(0, 3).map((listing) => ({
        id: listing.code,
        title: listing.title,
        status: listing.status,
        price: formatCurrency(listing.price),
        bids: String(listing.bidCount),
      })),
      currentListings,
      salesHistory,
      messages: threads.map((thread) => ({
        title: thread.subject,
        meta: thread.messages.at(-1)?.body || "No recent message",
      })),
    },
  });
});

export const getBidderOverview = asyncHandler(async (req, res) => {
  const [bids, watchlist, orders, threads] = await Promise.all([
    Bid.find({ bidder: req.user._id }).populate("auction"),
    Watchlist.find({ user: req.user._id }).populate({
      path: "auction",
      populate: { path: "seller", select: "name" },
    }),
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
        auctionId: item.auction?._id,
        title: item.auction?.title,
        status: item.auction?.status,
        currentBid: item.auction?.currentBid ? formatCurrency(item.auction.currentBid) : "--",
        seller: item.auction?.seller?.name || "AuctionArc seller",
      })),
      messages: threads.map((thread) => ({
        title: thread.subject,
        meta: thread.messages.at(-1)?.body || "No recent message",
      })),
    },
  });
});

export const getAdminOverview = asyncHandler(async (req, res) => {
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
    Auction.countDocuments({ status: { $in: ["Live", "Extended"] } }),
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
          String(await Auction.countDocuments({ status: { $in: ["Live", "Extended"] } })),
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
        meta: `${auction.status} auction updated ${auction.updatedAt.toISOString().slice(0, 10)}`,
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
  const listings = await Listing.find({ seller: req.user._id }).sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: listings.map((listing) => ({
      ...toListingCard(listing),
      listingId: listing._id,
      description: listing.description,
      currentBid: formatCurrency(listing.currentBid || listing.price || 0),
      condition: listing.condition,
      auctionDurationDays: listing.auctionDurationDays,
      views: String(listing.viewCount || 0),
      watchers: String(listing.watcherCount || 0),
    })),
  });
});

export const getSellerAuctions = asyncHandler(async (req, res) => {
  const auctions = await Auction.find({ seller: req.user._id }).sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: auctions.map((auction) => ({
      id: auction.code,
      title: auction.title,
      stage: auction.status,
      currentBid: auction.currentBid ? formatCurrency(auction.currentBid) : "--",
      watchers: String(auction.watcherCount || 0),
      ends: auction.endAt ? `${Math.max(Math.round((auction.endAt.getTime() - Date.now()) / 60000), 0)}m` : "Pending",
    })),
  });
});

export const getSellerOrders = asyncHandler(async (req, res) => {
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

export const updateSellerOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.orderId,
    seller: req.user._id,
  }).populate("bidder");

  if (!order) {
    throw new ApiError(404, "Order not found.");
  }

  order.status = req.body.status || order.status;
  await order.save();

  res.json({
    success: true,
    message: "Order status updated successfully.",
    data: {
      orderId: order._id,
      id: order.code,
      item: order.item,
      buyer: order.bidder?.name || "Unknown buyer",
      amount: formatCurrency(order.amount),
      status: order.status,
    },
  });
});

export const getSellerAnalytics = asyncHandler(async (req, res) => {
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
  const [auctions, watchlist] = await Promise.all([
    Auction.find({})
      .populate("seller", "name")
      .sort({ createdAt: -1 })
      .limit(6),
    Watchlist.find({ user: req.user._id }).select("auction"),
  ]);
  const watchedAuctionIds = new Set(watchlist.map((item) => String(item.auction)));

  res.json({
    success: true,
    data: auctions.map((auction) => ({
      ...toDiscoverRow(auction),
      auctionId: auction._id,
      seller: auction.seller?.name || "AuctionArc seller",
      sellerId: auction.seller?._id || null,
      watchlisted: watchedAuctionIds.has(String(auction._id)),
    })),
  });
});

export const getBidderBids = asyncHandler(async (req, res) => {
  const bids = await Bid.find({ bidder: req.user._id }).populate("auction");

  res.json({
    success: true,
    data: bids.map((bid) => ({
      id: bid.code,
      auctionId: bid.auction?._id,
      auction: bid.auction?.title || "Unknown auction",
      yourBid: formatCurrency(bid.amount),
      standing: bid.status === "Top bid" ? "Leading" : bid.status === "Outbid" ? "2nd place" : "Review hold",
      status: bid.status,
    })),
  });
});

export const getBidderWins = asyncHandler(async (req, res) => {
  const orders = await Order.find({ bidder: req.user._id }).populate("seller");

  res.json({
    success: true,
    data: orders.map((order) => ({
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
  const watchlist = await Watchlist.find({ user: req.user._id }).populate({
    path: "auction",
    populate: { path: "seller", select: "name" },
  });

  res.json({
    success: true,
    data: watchlist.map((item) => ({
      id: item.auction?.code,
      auctionId: item.auction?._id,
      title: item.auction?.title,
      status: item.auction?.status,
      currentBid: item.auction?.currentBid ? formatCurrency(item.auction.currentBid) : "--",
      seller: item.auction?.seller?.name || "AuctionArc seller",
      sellerId: item.auction?.seller?._id || null,
    })),
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
