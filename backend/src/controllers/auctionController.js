import { Auction } from "../models/Auction.js";
import { Bid } from "../models/Bid.js";
import { Listing } from "../models/Listing.js";
import { User } from "../models/User.js";
import { Watchlist } from "../models/Watchlist.js";
import { BID_STATUSES, LISTING_STATUSES } from "../constants/enums.js";
import { createNotification, createNotifications } from "../services/notificationService.js";
import { finalizeAuctionIfEnded } from "../services/auctionSettlementService.js";
import { uploadImageBuffer } from "../services/uploadService.js";
import { publishLiveEvent } from "../services/liveUpdateService.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateUniqueCode } from "../utils/codeGenerator.js";
import { formatAuctionDuration, parseAuctionDurationValue } from "../utils/auctionDuration.js";
import { formatCurrency } from "../utils/formatters.js";
import {
  assertNumber,
  assertOneOf,
  assertOptionalText,
  assertRequiredText,
} from "../utils/validation.js";

export const getPublicAuctions = asyncHandler(async (req, res) => {
  const listings = await Listing.find({
    status: { $in: ["Live", "Featured"] },
  })
    .populate("seller", "name")
    .sort({ premiumHighlight: -1, updatedAt: -1 })
    .limit(18);

  res.json({
    success: true,
    data: listings.map((listing) => {
      const imageUrl = listing.images?.[0]?.url || null;
      const images = (listing.images || []).map((image) => image?.url).filter(Boolean);

      return {
        listingId: listing._id,
        id: listing.code,
        title: listing.title,
        category: listing.category || "Uncategorized",
        seller: listing.seller?.name || "AuctionArc seller",
        status: listing.status,
        currentBid: formatCurrency(listing.currentBid || listing.price || 0),
        auctionWindow: `${formatAuctionDuration(listing.auctionDurationDays || 5, listing.auctionDurationUnit || "day")} auction`,
        priceLabel: listing.currentBid > listing.price ? "Current bid" : "Starting price",
        secondaryLabel: "Auction window",
        description: listing.description || "Public visitors can browse this listed auction product before creating an account.",
        condition: listing.condition || "Good",
        delivery: listing.deliveryOption || "AuctionArc Delivery",
        watchers: String(listing.watcherCount || 0),
        imageUrl,
        images,
        premiumHighlight: Boolean(listing.premiumHighlight || listing.status === "Featured"),
      };
    }),
  });
});

export const createListing = asyncHandler(async (req, res) => {
  if (req.user.role !== "Seller") {
    throw new ApiError(403, "Only sellers can create listings.");
  }

  const {
    title,
    category,
    description,
    price,
    buyNowPrice,
    condition,
    auctionDurationDays,
    auctionDurationUnit,
    deliveryOption,
    deliveryFee,
    premiumHighlight,
    status,
  } = req.body;

  const normalizedTitle = assertRequiredText(title, "Title", { maxLength: 160 });
  const normalizedCategory = assertRequiredText(category, "Category", { maxLength: 80 });
  const normalizedDescription = assertOptionalText(description, "Description", { maxLength: 3000 });
  const parsedPrice = assertNumber(price || 0, "Price", { min: 0, max: 100000000 });
  const parsedBuyNowPrice = assertNumber(buyNowPrice || 0, "Buy now price", { min: 0, max: 100000000 });
  const parsedDurationUnit = assertOneOf(auctionDurationUnit || "day", ["minute", "day"], "Auction duration unit");
  const parsedDuration = parseAuctionDurationValue(auctionDurationDays || 5, parsedDurationUnit);
  const parsedDeliveryFee = assertNumber(deliveryFee || 0, "Delivery fee", { min: 0, max: 1000000 });
  const wantsPremiumHighlight = premiumHighlight === "true" || premiumHighlight === true;

  const requestedStatus = status === "Pending approval" ? "Pending approval" : "Draft";

  if (requestedStatus === "Pending approval" && !req.files?.length) {
    throw new ApiError(400, "Please upload at least one image before submitting for approval.");
  }

  if ((req.files || []).length > 3) {
    throw new ApiError(400, "You can upload a maximum of 3 images.");
  }

  const code = await generateUniqueCode(Listing, "SL-", { digits: 3, min: 101 });
  const uploadedImages = await Promise.all(
    (req.files || []).map((file, index) =>
      uploadImageBuffer(
        file.buffer,
        "auctionarc/listings",
        `${code.toLowerCase()}-${index + 1}-${Date.now()}`,
      ),
    ),
  );

  let featureCreditReserved = false;

  if (wantsPremiumHighlight) {
    const updatedSeller = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        role: "Seller",
        "wallet.featureCredits": { $gte: 1 },
      },
      { $inc: { "wallet.featureCredits": -1 } },
      { new: true },
    );

    if (!updatedSeller) {
      throw new ApiError(400, "Complete the $1 feature payment before featuring this listing.");
    }

    featureCreditReserved = true;
  }

  let listing;

  try {
    listing = await Listing.create({
      code,
      seller: req.user._id,
      title: normalizedTitle,
      category: normalizedCategory,
      description: normalizedDescription,
      price: parsedPrice,
      reservePrice: 0,
      buyNowPrice: parsedBuyNowPrice,
      currentBid: parsedPrice,
      status: requestedStatus,
      reserveStatus: "Not set",
      condition: assertOptionalText(condition, "Condition", { maxLength: 40 }) || "Good",
      auctionDurationDays: parsedDuration,
      auctionDurationUnit: parsedDurationUnit,
      deliveryOption: deliveryOption || "AuctionArc Delivery",
      deliveryFee: parsedDeliveryFee,
      premiumHighlight: wantsPremiumHighlight,
      images: uploadedImages.filter(Boolean),
    });
  } catch (error) {
    if (featureCreditReserved) {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { "wallet.featureCredits": 1 },
      });
    }

    throw error;
  }

  if (wantsPremiumHighlight) {
    await createNotification({
      userId: req.user._id,
      title: "Feature credit applied",
      body: `"${listing.title}" will receive featured placement once it is approved.`,
      type: "listing-feature",
      href: "/seller/listings",
      metadata: {
        listingId: listing._id,
      },
    });
  }

  if (requestedStatus === "Pending approval") {
    const admins = await User.find({ role: "Admin", status: "Active" }).select("_id");

    await createNotifications(
      admins.map((admin) => ({
        userId: admin._id,
        title: "Listing awaiting approval",
        body: `${req.user.name} submitted "${listing.title}" for approval.`,
        type: "admin-review",
        href: "/admin/auctions/pending",
        metadata: {
          listingId: listing._id,
          sellerId: req.user._id,
        },
      })),
    );
  }

  res.status(201).json({
    success: true,
    message: "Listing created successfully.",
    data: listing,
  });
});

export const updateListing = asyncHandler(async (req, res) => {
  if (req.user.role !== "Seller") {
    throw new ApiError(403, "Only sellers can update listings.");
  }

  const listing = await Listing.findOne({
    _id: req.params.listingId,
    seller: req.user._id,
  });

  if (!listing) {
    throw new ApiError(404, "Listing not found.");
  }

  const {
    title,
    category,
    description,
    price,
    buyNowPrice,
    condition,
    auctionDurationDays,
    auctionDurationUnit,
    deliveryOption,
    deliveryFee,
    premiumHighlight,
    status,
  } = req.body;

  if (title) {
    listing.title = assertRequiredText(title, "Title", { maxLength: 160 });
  }

  if (category) {
    listing.category = assertRequiredText(category, "Category", { maxLength: 80 });
  }

  if (typeof description === "string") {
    listing.description = assertOptionalText(description, "Description", { maxLength: 3000 });
  }

  if (price !== undefined) {
    listing.price = assertNumber(price, "Price", { min: 0, max: 100000000 });
  }

  if (buyNowPrice !== undefined) {
    listing.buyNowPrice = assertNumber(buyNowPrice || 0, "Buy now price", { min: 0, max: 100000000 });
  }

  if (condition) {
    listing.condition = assertOptionalText(condition, "Condition", { maxLength: 40 }) || listing.condition;
  }

  if (auctionDurationDays !== undefined) {
    const nextUnit = auctionDurationUnit || listing.auctionDurationUnit || "day";
    listing.auctionDurationDays = parseAuctionDurationValue(
      auctionDurationDays || listing.auctionDurationDays,
      nextUnit,
    );
  }

  if (auctionDurationUnit !== undefined) {
    listing.auctionDurationUnit = assertOneOf(auctionDurationUnit || "day", ["minute", "day"], "Auction duration unit");
  }

  if (deliveryOption) {
    listing.deliveryOption = assertOptionalText(deliveryOption, "Delivery option", { maxLength: 80 }) || listing.deliveryOption;
  }

  if (deliveryFee !== undefined) {
    listing.deliveryFee = assertNumber(deliveryFee || 0, "Delivery fee", { min: 0, max: 1000000 });
  }

  if (premiumHighlight !== undefined) {
    listing.premiumHighlight = premiumHighlight === true || premiumHighlight === "true";
  }

  if (status) {
    if (!LISTING_STATUSES.includes(status)) {
      throw new ApiError(400, "Invalid listing status.");
    }

    listing.status = status;
  }

  await listing.save();

  res.json({
    success: true,
    message: "Listing updated successfully.",
    data: listing,
  });
});

export const deleteListing = asyncHandler(async (req, res) => {
  if (req.user.role !== "Seller") {
    throw new ApiError(403, "Only sellers can delete listings.");
  }

  const listing = await Listing.findOneAndDelete({
    _id: req.params.listingId,
    seller: req.user._id,
  });

  if (!listing) {
    throw new ApiError(404, "Listing not found.");
  }

  await Auction.deleteMany({ listing: listing._id, seller: req.user._id });

  res.json({
    success: true,
    message: "Listing deleted successfully.",
  });
});

export const placeBid = asyncHandler(async (req, res) => {
  if (req.user.role !== "Bidder") {
    throw new ApiError(403, "Only buyers can place bids.");
  }

  const auction = await Auction.findById(req.params.auctionId);

  if (!auction) {
    throw new ApiError(404, "Auction not found.");
  }

  if (auction.endAt && auction.endAt.getTime() <= Date.now()) {
    await finalizeAuctionIfEnded(auction._id);
    throw new ApiError(400, "This auction has already ended.");
  }

  if (!["Live", "Extended"].includes(auction.status)) {
    throw new ApiError(400, "Bids can only be placed on live or extended auctions.");
  }

  const amount = Number(req.body.amount);

  if (!amount || Number.isNaN(amount) || amount <= auction.currentBid) {
    throw new ApiError(400, "Bid amount must be higher than the current bid.");
  }

  if (amount > 100000000) {
    throw new ApiError(400, "Bid amount is too large.");
  }

  const code = await generateUniqueCode(Bid, "BID-", { digits: 4, min: 7101 });

  const bid = await Bid.create({
    code,
    auction: auction._id,
    listing: auction.listing,
    bidder: req.user._id,
    amount,
    status: BID_STATUSES.includes("Top bid") ? "Top bid" : "Valid",
    signal: amount > auction.currentBid * 1.15 ? "High intent" : "Normal",
  });

  const outbidBids = await Bid.find({
    auction: auction._id,
    bidder: { $ne: req.user._id },
    status: { $nin: ["Held", "Review", "Pending check"] },
  })
    .select("bidder")
    .populate("bidder", "_id");

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

  publishLiveEvent({
    event: "bid.updated",
    channels: ["market:auctions", "market:bids"],
    userIds: [req.user._id, auction.seller],
    roles: ["Admin"],
    payload: {
      auctionId: auction._id,
      bidderId: req.user._id,
      sellerId: auction.seller,
      amount,
    },
  });

  await createNotification({
    userId: req.user._id,
    title: "Your bid was placed",
    body: `You placed ${formatCurrency(amount)} on "${auction.title}".`,
    type: "bid",
    href: "/bidder/my-bids",
    metadata: {
      auctionId: auction._id,
      amount,
    },
  });

  await createNotification({
    userId: auction.seller,
    title: "New bid on your auction",
    body: `${req.user.name} placed ${formatCurrency(amount)} on "${auction.title}".`,
    type: "bid",
    href: "/seller/auctions",
    metadata: {
      auctionId: auction._id,
      bidderId: req.user._id,
    },
  });

  const outbidBuyerIds = Array.from(
    new Set(
      outbidBids
        .map((item) => String(item.bidder?._id || ""))
        .filter((bidderId) => bidderId && bidderId !== String(req.user._id)),
    ),
  );

  await createNotifications(
    outbidBuyerIds.map((bidderId) => ({
      userId: bidderId,
      title: "You were outbid",
      body: `Another buyer moved ahead of you on "${auction.title}".`,
      type: "bid",
      href: "/bidder/my-bids",
      metadata: {
        auctionId: auction._id,
        amount,
      },
    })),
  );

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
    throw new ApiError(403, "Only buyers can manage watchlists.");
  }

  const auction = await Auction.findById(req.params.auctionId);

  if (!auction) {
    throw new ApiError(404, "Auction not found.");
  }

  const existingWatch = await Watchlist.findOne({
    user: req.user._id,
    auction: auction._id,
  });

  if (existingWatch) {
    res.json({
      success: true,
      message: "Auction is already in your watchlist.",
    });
    return;
  }

  await Watchlist.create({
    user: req.user._id,
    auction: auction._id,
  });

  auction.watcherCount += 1;
  await auction.save();

  publishLiveEvent({
    event: "watchlist.updated",
    channels: ["market:auctions", "market:watchlist"],
    userIds: [req.user._id, auction.seller],
    roles: ["Admin"],
    payload: {
      auctionId: auction._id,
      bidderId: req.user._id,
      sellerId: auction.seller,
      watcherCount: auction.watcherCount,
      action: "added",
    },
  });

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

  publishLiveEvent({
    event: "watchlist.updated",
    channels: ["market:auctions", "market:watchlist"],
    userIds: [req.user._id, auction.seller],
    roles: ["Admin"],
    payload: {
      auctionId: auction._id,
      bidderId: req.user._id,
      sellerId: auction.seller,
      watcherCount: auction.watcherCount,
      action: "removed",
    },
  });

  res.json({
    success: true,
    message: "Auction removed from watchlist.",
  });
});
