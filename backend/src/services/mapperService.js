import { formatCompactNumber, formatCountdown, formatCurrency, formatRelativeTime } from "../utils/formatters.js";

export function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    publicRoleLabel: user.publicRoleLabel,
    status: user.status,
    gender: user.gender,
    birthdate: user.birthdate,
    country: user.country,
    location: user.location,
    contact: user.contact,
    nid: user.nid,
    profilePicture: user.profilePicture || null,
    preferences: user.preferences,
    wallet: user.wallet,
    verification: user.verification,
    stats: user.stats,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toTableUser(user) {
  return {
    id: `USR-${String(user._id).slice(-4).toUpperCase()}`,
    name: user.name,
    role: user.role,
    status: user.status,
    country: user.country || "Unknown",
    contact: user.contact || "Not set",
    joined: user.createdAt?.toISOString().slice(0, 10),
    lastSeen: formatRelativeTime(user.lastSeenAt || user.updatedAt),
  };
}

export function toListingCard(listing) {
  return {
    id: listing.code,
    title: listing.title,
    category: listing.category,
    status: listing.status,
    reserve: listing.reserveStatus,
    price: formatCurrency(listing.price),
    bids: String(listing.bidCount),
  };
}

export function toAuctionRow(auction) {
  return {
    id: auction.code,
    title: auction.title,
    status: auction.status,
    reserve: auction.reserveStatus,
    countdown:
      auction.status === "Scheduled" && auction.startAt
        ? `Starts ${formatRelativeTime(auction.startAt)}`
        : formatCountdown(auction.endAt),
    bids: String(auction.bidCount),
  };
}

export function toDiscoverRow(auction) {
  const interest =
    auction.watcherCount > 80 ? "Hot" : auction.watcherCount > 40 ? "High" : "Rising";

  return {
    id: auction.code,
    title: auction.title,
    category: auction.category,
    stage: auction.status === "Scheduled" ? "New" : auction.status,
    price: formatCurrency(auction.currentBid || 0),
    interest,
  };
}

export function toBidRow(bid) {
  return {
    id: bid.code,
    auction: bid.auction?.title || "Unknown auction",
    bidder: bid.bidder?.name || "Unknown bidder",
    amount: formatCurrency(bid.amount),
    status: bid.status,
    signal: bid.signal,
    yourBid: formatCurrency(bid.amount),
    standing:
      bid.status === "Top bid"
        ? "Leading"
        : bid.status === "Outbid"
          ? "2nd place"
          : "Review hold",
  };
}

export function toThreadRow(thread) {
  const lastMessage = thread.messages.at(-1);

  return {
    id: thread.code,
    subject: thread.subject,
    priority: thread.priority,
    status: thread.status,
    participants: thread.participants.map((item) => item.roleLabel).join(" + "),
    lastMessage: lastMessage?.body || "No messages yet",
    messages: thread.messages.map((message) => ({
      from: message.senderName,
      body: message.body,
    })),
  };
}

export function toTransactionRow(transaction) {
  return {
    id: transaction.code,
    user: transaction.user?.name || "Unknown user",
    type: transaction.type,
    status: transaction.status,
    amount: formatCurrency(transaction.amount),
    channel: transaction.channel,
  };
}

export function toStats(label, value, delta, tone = "neutral") {
  return { label, value, delta, tone };
}

export function compactAmount(value) {
  return formatCompactNumber(value);
}
