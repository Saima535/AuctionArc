/**
 * Provides reusable auction filters and lifecycle predicate helpers.
 */
const ACTIVE_VISIBLE_AUCTION_STATUSES = ["Live", "Extended"];
const OPEN_AUCTION_STATUSES = ["Scheduled", "Live", "Extended"];

function withStartedFilter(now) {
  return {
    $or: [
      { startAt: null },
      { startAt: { $exists: false } },
      { startAt: { $lte: now } },
    ],
  };
}

function withFutureEndFilter(now) {
  return {
    $or: [
      { endAt: null },
      { endAt: { $exists: false } },
      { endAt: { $gt: now } },
    ],
  };
}

export function buildActiveAuctionFilter(now = new Date()) {
  return {
    status: { $in: ACTIVE_VISIBLE_AUCTION_STATUSES },
    $and: [withStartedFilter(now), withFutureEndFilter(now)],
  };
}

export function buildWatchableAuctionFilter(now = new Date()) {
  return {
    status: { $in: OPEN_AUCTION_STATUSES },
    $and: [withFutureEndFilter(now)],
  };
}

export function isAuctionExpired(auction, now = new Date()) {
  if (!auction?.endAt) {
    return false;
  }

  return new Date(auction.endAt).getTime() <= now.getTime();
}

export function hasAuctionStarted(auction, now = new Date()) {
  if (!auction?.startAt) {
    return true;
  }

  return new Date(auction.startAt).getTime() <= now.getTime();
}

export function isAuctionActive(auction, now = new Date()) {
  return (
    Boolean(auction) &&
    ACTIVE_VISIBLE_AUCTION_STATUSES.includes(auction.status) &&
    hasAuctionStarted(auction, now) &&
    !isAuctionExpired(auction, now)
  );
}

export function isAuctionWatchable(auction, now = new Date()) {
  return (
    Boolean(auction) &&
    OPEN_AUCTION_STATUSES.includes(auction.status) &&
    !isAuctionExpired(auction, now)
  );
}

export function deriveAuctionLifecycleLabel(auction, now = new Date()) {
  if (!auction) {
    return "Unavailable";
  }

  if (auction.status === "Closed") {
    if (auction.winner) {
      return "Sold";
    }

    return "Expired";
  }

  if (!hasAuctionStarted(auction, now)) {
    return "Scheduled";
  }

  if (isAuctionExpired(auction, now)) {
    return auction.winner ? "Sold" : "Expired";
  }

  return auction.status;
}

export { ACTIVE_VISIBLE_AUCTION_STATUSES, OPEN_AUCTION_STATUSES };
