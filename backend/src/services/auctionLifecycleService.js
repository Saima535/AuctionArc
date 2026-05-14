import { Auction } from "../models/Auction.js";
import { generateUniqueCode } from "../utils/codeGenerator.js";
import { addAuctionDuration } from "../utils/auctionDuration.js";

function deriveAuctionStatus(listingStatus) {
  if (listingStatus === "Live" || listingStatus === "Featured") {
    return "Live";
  }

  if (listingStatus === "Rejected") {
    return "Under review";
  }

  return "Paused";
}

export async function syncAuctionForListing(listing) {
  const existingAuction = await Auction.findOne({ listing: listing._id }).sort({ createdAt: -1 });
  const nextStatus = deriveAuctionStatus(listing.status);
  const shouldFeature = listing.status === "Featured" || Boolean(listing.premiumHighlight);

  if (!existingAuction) {
    if (!["Live", "Featured"].includes(listing.status)) {
      return null;
    }

    const now = new Date();
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
  existingAuction.status = nextStatus;

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
