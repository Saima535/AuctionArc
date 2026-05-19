/**
 * Drives public auction browsing plus seller listing and bidder bidding actions.
 */
import mongoose from "mongoose";
import { Auction } from "../models/Auction.js";
import { Bid } from "../models/Bid.js";
import { Listing } from "../models/Listing.js";
import { Watchlist } from "../models/Watchlist.js";
import { BID_STATUSES, LISTING_STATUSES } from "../constants/enums.js";
import {
  createNotification,
  createNotifications,
  createNotificationsOnce,
} from "../services/notificationService.js";
import { finalizeAuctionIfEnded } from "../services/auctionSettlementService.js";
import {
  buildActiveAuctionFilter,
  isAuctionWatchable,
} from "../services/auctionQueryService.js";
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
  const now = new Date();
  const auctions = await Auction.find(buildActiveAuctionFilter(now))
    .populate("listing")
    .populate("seller", "name")
    .sort({ featured: -1, updatedAt: -1 })
    .limit(18);

  res.json({
    success: true,
    data: auctions
      .filter((auction) => auction.listing)
      .map((auction) => {
      const listing = auction.listing;
      const imageUrl = listing.images?.[0]?.url || null;
      const images = (listing.images || []).map((image) => image?.url).filter(Boolean);

      return {
        listingId: listing._id,
        auctionId: auction._id,
        id: auction.code,
        title: auction.title || listing.title,
        category: auction.category || listing.category || "Uncategorized",
        seller: auction.seller?.name || "AuctionArc seller",
        status: auction.status,
        currentBid: formatCurrency(auction.currentBid || listing.currentBid || listing.price || 0),
        auctionWindow: `${formatAuctionDuration(listing.auctionDurationDays || 5, listing.auctionDurationUnit || "day")} auction`,
        priceLabel: (auction.currentBid || listing.currentBid || 0) > listing.price ? "Current bid" : "Starting price",
        secondaryLabel: "Auction window",
        description: listing.description || "Public visitors can browse this listed auction product before creating an account.",
        condition: listing.condition || "Good",
        delivery: listing.deliveryOption || "AuctionArc Delivery",
        watchers: String(auction.watcherCount || listing.watcherCount || 0),
        startAt: auction.startAt || null,
        endAt: auction.endAt || null,
        imageUrl,
        images,
        premiumHighlight: Boolean(auction.featured || listing.premiumHighlight || listing.status === "Featured"),
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
    throw error;
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

  const previousListingState = {
    title: listing.title,
    description: listing.description || "",
    condition: listing.condition || "",
    deliveryOption: listing.deliveryOption || "",
    price: Number(listing.price || 0),
    buyNowPrice: Number(listing.buyNowPrice || 0),
  };

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

  const detailsChanged =
    previousListingState.title !== listing.title ||
    previousListingState.description !== (listing.description || "") ||
    previousListingState.condition !== (listing.condition || "") ||
    previousListingState.deliveryOption !== (listing.deliveryOption || "") ||
    previousListingState.price !== Number(listing.price || 0) ||
    previousListingState.buyNowPrice !== Number(listing.buyNowPrice || 0);
  const priceDropped =
    Number(listing.price || 0) < previousListingState.price ||
    (previousListingState.buyNowPrice > 0 &&
      Number(listing.buyNowPrice || 0) > 0 &&
      Number(listing.buyNowPrice || 0) < previousListingState.buyNowPrice);

  if (detailsChanged) {
    const auction = await Auction.findOne({ listing: listing._id }).select("_id");

    if (auction?._id) {
      const watchlistUserIds = await Watchlist.find({ auction: auction._id }).distinct("user");

      if (watchlistUserIds.length) {
        const baseMetadata = {
          listingId: listing._id,
          auctionId: auction._id,
          sellerId: req.user._id,
        };

        if (priceDropped) {
          await createNotificationsOnce(
            watchlistUserIds.map((userId) => ({
              userId,
              title: "Price dropped on watched item",
              body: `The price for "${listing.title}" moved from ${formatCurrency(previousListingState.price)} to ${formatCurrency(listing.price || 0)}.`,
              type: "listing",
              href: "/bidder/watchlist",
              dedupKey: `watchlist-price-drop:${auction._id}:${Number(listing.price || 0)}:${Number(listing.buyNowPrice || 0)}`,
              metadata: {
                ...baseMetadata,
                previousPrice: previousListingState.price,
                currentPrice: Number(listing.price || 0),
                previousBuyNowPrice: previousListingState.buyNowPrice,
                currentBuyNowPrice: Number(listing.buyNowPrice || 0),
              },
            })),
          );
        } else {
          await createNotificationsOnce(
            watchlistUserIds.map((userId) => ({
              userId,
              title: "Listing information updated",
              body: `The seller updated details for "${listing.title}".`,
              type: "listing",
              href: "/bidder/watchlist",
              dedupKey: `watchlist-listing-update:${auction._id}:${listing.updatedAt?.getTime?.() || Date.now()}`,
              metadata: baseMetadata,
            })),
          );
        }
      }
    }
  }

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

  const amount = Number(req.body.amount);
  const MIN_BID_INCREMENT = 1;

  if (!amount || Number.isNaN(amount) || amount <= 0) {
    throw new ApiError(400, "Enter a valid bid amount.");
  }

  if (amount > 100000000) {
    throw new ApiError(400, "Bid amount is too large.");
  }

  const session = await mongoose.startSession();
  let auction;
  let bid;
  let outbidBuyerIds = [];

  try {
    await session.withTransaction(async () => {
      auction = await Auction.findById(req.params.auctionId).session(session);

      if (!auction) {
        throw new ApiError(404, "Auction not found.");
      }

      const now = new Date();

      if (String(auction.seller) === String(req.user._id)) {
        throw new ApiError(400, "You cannot bid on your own auction.");
      }

      if (auction.startAt && auction.startAt.getTime() > now.getTime()) {
        throw new ApiError(400, "This auction has not started yet.");
      }

      if (auction.endAt && auction.endAt.getTime() <= now.getTime()) {
        throw new ApiError(400, "This auction has already ended.");
      }

      if (!["Live", "Extended"].includes(auction.status)) {
        throw new ApiError(400, "Bids can only be placed on live or extended auctions.");
      }

      const minimumAllowedBid = Number(auction.currentBid || 0) + MIN_BID_INCREMENT;

      if (amount < minimumAllowedBid) {
        throw new ApiError(400, `Bid amount must be at least ${formatCurrency(minimumAllowedBid)}.`);
      }

      outbidBuyerIds = await Bid.find({
        auction: auction._id,
        bidder: { $ne: req.user._id },
        status: { $nin: ["Held", "Review", "Pending check"] },
      })
        .session(session)
        .distinct("bidder");

      const updatedAuction = await Auction.findOneAndUpdate(
        {
          _id: auction._id,
          currentBid: auction.currentBid,
          ...buildActiveAuctionFilter(now),
        },
        {
          $set: { currentBid: amount },
          $inc: { bidCount: 1 },
        },
        { new: true, session },
      );

      if (!updatedAuction) {
        throw new ApiError(409, "Another bid was accepted first. Refresh and try again.");
      }

      const code = await generateUniqueCode(Bid, "BID-", { digits: 4, min: 7101 });
      const createdBids = await Bid.create([{
        code,
        auction: updatedAuction._id,
        listing: updatedAuction.listing,
        bidder: req.user._id,
        amount,
        status: BID_STATUSES.includes("Top bid") ? "Top bid" : "Valid",
        signal: amount > Number(auction.currentBid || 0) * 1.15 ? "High intent" : "Normal",
      }], { session });
      bid = createdBids[0];

      await Bid.updateMany(
        {
          auction: updatedAuction._id,
          _id: { $ne: bid._id },
          status: { $nin: ["Held", "Review", "Pending check"] },
        },
        { $set: { status: "Outbid" } },
        { session },
      );

      await Listing.findByIdAndUpdate(
        updatedAuction.listing,
        {
          $set: { currentBid: amount },
          $inc: { bidCount: 1 },
        },
        { session },
      );

      auction = updatedAuction;
    });
  } catch (error) {
    if (error instanceof ApiError && error.message === "This auction has already ended.") {
      await finalizeAuctionIfEnded(req.params.auctionId);
    }

    throw error;
  } finally {
    await session.endSession();
  }

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

  const normalizedOutbidBuyerIds = Array.from(
    new Set(outbidBuyerIds.map((bidderId) => String(bidderId || "")).filter(Boolean)),
  );

  await createNotifications(
    normalizedOutbidBuyerIds.map((bidderId) => ({
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

  if (!isAuctionWatchable(auction)) {
    throw new ApiError(400, "Only scheduled or active auctions can be added to the watchlist.");
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
