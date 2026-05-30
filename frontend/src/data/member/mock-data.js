export const sellerOverview = {
  kpis: [
    { label: "Live listings", value: "0", delta: "No live listings yet", tone: "neutral" },
    { label: "Active buyers", value: "0", delta: "No buyer activity yet", tone: "neutral" },
    { label: "Gross sales", value: "$0", delta: "No sales yet", tone: "neutral" },
    { label: "Orders in progress", value: "0", delta: "No active orders yet", tone: "neutral" },
  ],
  activity: [],
  listings: [],
  messages: [],
};

export const sellerListings = [];

export const sellerAuctions = [];

export const sellerOrders = [];

export const sellerAnalytics = {
  bids: [0, 0, 0, 0, 0, 0, 0],
  conversion: [0, 0, 0, 0, 0, 0, 0],
};

export const bidderOverview = {
  kpis: [
    { label: "Active bids", value: "0", delta: "No active bids yet", tone: "neutral" },
    { label: "Auctions won", value: "0", delta: "No wins yet", tone: "neutral" },
    { label: "Open conversations", value: "0", delta: "No active conversations", tone: "neutral" },
  ],
  activity: [],
  messages: [],
};

export const bidderDiscover = [];

export const bidderBids = [];

export const bidderWins = [];

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
    { label: "Account status", value: "New", delta: "No review data", tone: "neutral" },
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
      description: "How your storefront and listings appear to buyers.",
      items: [],
    },
  ],
};

export const bidderProfile = {
  name: "Not set",
  role: "Buyer",
  email: "Not set",
  location: "Not set",
  stats: [
    { label: "Winning rate", value: "0%", delta: "No bidding history yet", tone: "neutral" },
    { label: "Account status", value: "New", delta: "No review data", tone: "neutral" },
    { label: "Avg. bid response", value: "0m", delta: "No bid activity yet", tone: "neutral" },
  ],
  sections: [
    {
      title: "Personal profile",
      description: "Buyer identity, visibility, and account trust details.",
      items: [],
    },
    {
      title: "Communication preferences",
      description: "How sellers and support teams can reach you.",
      items: [],
    },
    {
      title: "Verification records",
      description: "Identity and payment records.",
      items: [],
    },
    {
      title: "Buying preferences",
      description: "Auction discovery and category preference controls.",
      items: [],
    },
  ],
};
