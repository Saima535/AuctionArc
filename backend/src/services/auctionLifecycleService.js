/**
 * Synchronizes listing approval state with auction records and timing-based status changes.
 */
import { Auction } from "../models/Auction.js";
import { generateUniqueCode } from "../utils/codeGenerator.js";
import { addAuctionDuration } from "../utils/auctionDuration.js";
import { hasAuctionStarted, isAuctionExpired } from "./auctionQueryService.js";

function deriveAuctionStatus(listingStatus) {
  if (listingStatus === "Live" || listingStatus === "Featured") {
    return "Live";
  }

  if (listingStatus === "Rejected") {
    return "Under review";
  }

  return "Paused";
}

function resolveTimedAuctionStatus(auction, listingStatus, now = new Date()) {
  if (auction.status === "Closed") {
    return "Closed";
  }

  const listingDrivenStatus = deriveAuctionStatus(listingStatus);

  if (!["Live", "Featured"].includes(listingStatus)) {
    return listingDrivenStatus;
  }

  if (isAuctionExpired(auction, now)) {
    return "Closed";
  }

  if (!hasAuctionStarted(auction, now)) {
    return "Scheduled";
  }

  return auction.status === "Extended" ? "Extended" : "Live";
}

export async function syncAuctionForListing(listing) {
  const existingAuction = await Auction.findOne({ listing: listing._id }).sort({ createdAt: -1 });
  const now = new Date();
  const nextStatus = deriveAuctionStatus(listing.status);
  const shouldFeature = listing.status === "Featured" || Boolean(listing.premiumHighlight);

  if (!existingAuction) {
    if (!["Live", "Featured"].includes(listing.status)) {
      return null;
    }

    const startAt = now;
    const endAt = addAuctionDuration(
      startAt,
      listing.auctionDurationDays || 5,
      listing.auctionDurationUnit || "day",
    );
    const code = await generateUniqueCode(Auction, "AUC-", { digits: 4, min: 4001 });

    return Auction.create({
      code,
      listing: listing._id,
      seller: listing.seller,
      title: listing.title,
      status: nextStatus,
      reserveStatus: listing.reserveStatus || "Pending",
      currentBid: listing.currentBid || listing.price || 0,
      watcherCount: listing.watcherCount || 0,
      bidCount: listing.bidCount || 0,
      startAt,
      endAt,
      featured: shouldFeature,
      category: listing.category,
    });
  }

  existingAuction.title = listing.title;
  existingAuction.seller = listing.seller;
  existingAuction.category = listing.category;
  existingAuction.reserveStatus = listing.reserveStatus || existingAuction.reserveStatus || "Pending";
  existingAuction.currentBid = listing.currentBid || listing.price || existingAuction.currentBid || 0;
  existingAuction.featured = shouldFeature;
  existingAuction.status = resolveTimedAuctionStatus(existingAuction, listing.status, now);

  if (["Live", "Featured"].includes(listing.status)) {
    const startAt = existingAuction.startAt || new Date();
    existingAuction.startAt = startAt;
    existingAuction.endAt =
      existingAuction.endAt ||
      addAuctionDuration(
        startAt,
        listing.auctionDurationDays || 5,
        listing.auctionDurationUnit || "day",
      );
  }

  await existingAuction.save();
  return existingAuction;
}

export async function syncAuctionsForListings(listings = []) {
  const synced = [];

  for (const listing of listings) {
    const auction = await syncAuctionForListing(listing);

    if (auction) {
      synced.push(auction);
    }
  }

  return synced;
}

export async function syncStaleAuctionStates({ now = new Date() } = {}) {
  const auctions = await Auction.find({
    status: { $in: ["Scheduled", "Live", "Extended"] },
  }).select("_id status startAt endAt winner");
  const updates = [];

  for (const auction of auctions) {
    let nextStatus = auction.status;

    if (isAuctionExpired(auction, now)) {
      nextStatus = "Closed";
    } else if (!hasAuctionStarted(auction, now)) {
      nextStatus = "Scheduled";
    } else if (auction.status === "Scheduled") {
      nextStatus = "Live";
    }

    if (nextStatus !== auction.status) {
      auction.status = nextStatus;
      updates.push(auction.save());
    }
  }

  if (!updates.length) {
    return [];
  }

  return Promise.all(updates);
}
