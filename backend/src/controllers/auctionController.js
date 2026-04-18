import { Auction } from "../models/Auction.js";
import { Bid } from "../models/Bid.js";
import { Listing } from "../models/Listing.js";
import { Watchlist } from "../models/Watchlist.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { formatCurrency } from "../utils/formatters.js";

export const createListing = asyncHandler(async (req, res) => {
  if (req.user.role !== "Seller") {
    throw new ApiError(403, "Only sellers can create listings.");
  }

  const { title, category, description, price, reservePrice } = req.body;

  if (!title || !category) {
    throw new ApiError(400, "Title and category are required.");
  }

  const count = await Listing.countDocuments();
  const code = `SL-${String(count + 101).padStart(3, "0")}`;

  const listing = await Listing.create({
    code,
    seller: req.user._id,
    title,
    category,
    description,
    price: Number(price || 0),
    reservePrice: Number(reservePrice || 0),
    currentBid: Number(price || 0),
    status: "Draft",
    reserveStatus: reservePrice ? "Pending" : "Not set",
  });

  res.status(201).json({
    success: true,
    message: "Listing created successfully.",
    data: listing,
  });
});

export const placeBid = asyncHandler(async (req, res) => {
  if (req.user.role !== "Bidder") {
    throw new ApiError(403, "Only bidders can place bids.");
  }

  const auction = await Auction.findById(req.params.auctionId);

  if (!auction) {
    throw new ApiError(404, "Auction not found.");
  }

  if (!["Live", "Extended"].includes(auction.status)) {
    throw new ApiError(400, "Bids can only be placed on live or extended auctions.");
  }

  const amount = Number(req.body.amount);

  if (!amount || amount <= auction.currentBid) {
    throw new ApiError(400, "Bid amount must be higher than the current bid.");
  }

  const bidCount = await Bid.countDocuments();

  const bid = await Bid.create({
    code: `BID-${7101 + bidCount}`,
    auction: auction._id,
    listing: auction.listing,
    bidder: req.user._id,
    amount,
    status: "Top bid",
    signal: amount > auction.currentBid * 1.15 ? "High intent" : "Normal",
  });

  await Bid.updateMany(
    {
      auction: auction._id,
      _id: { $ne: bid._id },
      bidder: { $ne: req.user._id },
      status: { $nin: ["Held", "Review", "Pending check"] },
    },
    { $set: { status: "Outbid" } },
  );

  auction.currentBid = amount;
  auction.bidCount += 1;
  await auction.save();

  await Listing.findByIdAndUpdate(auction.listing, {
    currentBid: amount,
    $inc: { bidCount: 1 },
  });

  res.status(201).json({
    success: true,
    message: "Bid placed successfully.",
    data: {
      id: bid.code,
      auction: auction.title,
      yourBid: formatCurrency(bid.amount),
      status: bid.status,
    },
  });
});

export const addToWatchlist = asyncHandler(async (req, res) => {
  if (req.user.role !== "Bidder") {
    throw new ApiError(403, "Only bidders can manage watchlists.");
  }

  const auction = await Auction.findById(req.params.auctionId);

  if (!auction) {
    throw new ApiError(404, "Auction not found.");
  }

  await Watchlist.findOneAndUpdate(
    {
      user: req.user._id,
      auction: auction._id,
    },
    {
      user: req.user._id,
      auction: auction._id,
    },
    { upsert: true, new: true },
  );

  auction.watcherCount += 1;
  await auction.save();

  res.json({
    success: true,
    message: "Auction added to watchlist.",
  });
});

export const removeFromWatchlist = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.auctionId);

  if (!auction) {
    throw new ApiError(404, "Auction not found.");
  }

  const removed = await Watchlist.findOneAndDelete({
    user: req.user._id,
    auction: auction._id,
  });

  if (!removed) {
    throw new ApiError(404, "Watchlist item not found.");
  }

  auction.watcherCount = Math.max((auction.watcherCount || 1) - 1, 0);
  await auction.save();

  res.json({
    success: true,
    message: "Auction removed from watchlist.",
  });
});
