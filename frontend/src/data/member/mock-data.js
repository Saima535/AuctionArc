export const sellerOverview = {
  kpis: [
    { label: "Live listings", value: "0", delta: "No live listings yet", tone: "neutral" },
    { label: "Active bidders", value: "0", delta: "No bidder activity yet", tone: "neutral" },
    { label: "Gross sales", value: "$0", delta: "No sales yet", tone: "neutral" },
    { label: "Pending payouts", value: "$0", delta: "No payouts pending", tone: "neutral" },
  ],
  activity: [],
  listings: [],
  messages: [],
};

export const sellerListings = [];

export const sellerAuctions = [];

export const sellerOrders = [];

export const sellerAnalytics = {
  views: [0, 0, 0, 0, 0, 0, 0],
  bids: [0, 0, 0, 0, 0, 0, 0],
  conversion: [0, 0, 0, 0, 0, 0, 0],
};

export const sellerWallet = {
  stats: [
    { label: "Available balance", value: "$0", delta: "No earnings yet", tone: "neutral" },
    { label: "Pending payout", value: "$0", delta: "No payouts pending", tone: "neutral" },
    { label: "Escrow held", value: "$0", delta: "No escrow holds", tone: "neutral" },
    { label: "Platform fees", value: "$0", delta: "No fees yet", tone: "neutral" },
  ],
};

export const bidderOverview = {
  kpis: [
    { label: "Active bids", value: "0", delta: "No active bids yet", tone: "neutral" },
    { label: "Watchlist items", value: "0", delta: "Watchlist is empty", tone: "neutral" },
    { label: "Auctions won", value: "0", delta: "No wins yet", tone: "neutral" },
    { label: "Funds on hold", value: "$0", delta: "No funds on hold", tone: "neutral" },
  ],
  activity: [],
  watchlist: [],
  messages: [],
};

export const bidderDiscover = [];

export const bidderBids = [];

export const bidderWins = [];

export const bidderWallet = {
  stats: [
    { label: "Available funds", value: "$0", delta: "No wallet activity yet", tone: "neutral" },
    { label: "Funds on hold", value: "$0", delta: "No active holds", tone: "neutral" },
    { label: "Recent payments", value: "$0", delta: "No payments yet", tone: "neutral" },
    { label: "Refunds pending", value: "$0", delta: "No refunds pending", tone: "neutral" },
  ],
};

export const memberThreads = [];

export const sellerProfile = {
  name: "Not set",
  role: "Seller",
  email: "Not set",
  location: "Not set",
  stats: [
    { label: "Seller rating", value: "0/5", delta: "No rating yet", tone: "neutral" },
    { label: "Completed sales", value: "0", delta: "No sales yet", tone: "neutral" },
    { label: "Buyer response time", value: "0m", delta: "No conversations yet", tone: "neutral" },
    { label: "Verification status", value: "Not started", delta: "No verification data", tone: "neutral" },
  ],
  sections: [
    {
      title: "Business profile",
      description: "Public-facing storefront identity and trust markers.",
      items: [],
    },
    {
      title: "Contact details",
      description: "Internal and public communication settings for buyers.",
      items: [],
    },
    {
      title: "Compliance documents",
      description: "Seller identity and ownership records.",
      items: [],
    },
    {
      title: "Visibility controls",
      description: "How your storefront and listings appear to bidders.",
      items: [],
    },
  ],
};

export const bidderProfile = {
  name: "Not set",
  role: "Bidder",
  email: "Not set",
  location: "Not set",
  stats: [
    { label: "Winning rate", value: "0%", delta: "No bidding history yet", tone: "neutral" },
    { label: "Watchlist growth", value: "0", delta: "No saved items yet", tone: "neutral" },
    { label: "Verification status", value: "Not started", delta: "No verification data", tone: "neutral" },
    { label: "Avg. bid response", value: "0m", delta: "No bid activity yet", tone: "neutral" },
  ],
  sections: [
    {
      title: "Personal profile",
      description: "Bidder identity, visibility, and account trust details.",
      items: [],
    },
    {
      title: "Communication preferences",
      description: "How sellers and support teams can reach you.",
      items: [],
    },
    {
      title: "Verification records",
      description: "Identity, wallet, and payment records.",
      items: [],
    },
    {
      title: "Buying preferences",
      description: "Auction discovery and category preference controls.",
      items: [],
    },
  ],
};
