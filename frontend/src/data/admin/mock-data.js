export const adminOverview = {
  kpis: [
    { label: "Active auctions", value: "0", delta: "No auctions yet", tone: "neutral" },
    { label: "Verified sellers", value: "0", delta: "No verified sellers yet", tone: "neutral" },
    { label: "Bid volume today", value: "$0", delta: "No bids today", tone: "neutral" },
    { label: "Open disputes", value: "0", delta: "No open disputes", tone: "neutral" },
  ],
  alerts: [],
  activity: [],
  categories: [],
  registrations: [],
  supportQueue: [],
};

export const insightSeries = {
  marketplaceGrowth: [0, 0, 0, 0, 0, 0, 0],
  bidVolume: [0, 0, 0, 0, 0, 0, 0],
  conversion: [0, 0, 0, 0, 0, 0, 0],
  fraudSignals: [0, 0, 0, 0, 0, 0, 0],
};

export const insightCards = [
  { label: "Gross marketplace activity", value: "$0", delta: "No activity yet", tone: "neutral" },
  { label: "Average auction completion", value: "0%", delta: "No completed auctions yet", tone: "neutral" },
  { label: "Fraud review rate", value: "0%", delta: "No reviews yet", tone: "neutral" },
  { label: "Support resolution time", value: "0m", delta: "No support history yet", tone: "neutral" },
];

export const topPerformers = {
  sellers: [],
  categories: [],
  products: [],
};

export const usersData = [];

export const featuredUser = {
  name: "No user selected",
  role: "User",
  status: "No data",
  notes: [],
};

export const productsData = [];

export const featuredProduct = {
  title: "No product selected",
  seller: "Not available",
  status: "No data",
  notes: [],
};

export const auctionsData = [];

export const bidsData = [];

export const chatThreads = [];

export const reportsData = [];

export const transactionsData = [];

export const transactionStats = [
  { label: "Wallet balance in motion", value: "$0", delta: "No wallet movement yet", tone: "neutral" },
  { label: "Pending payouts", value: "$0", delta: "No pending payouts", tone: "neutral" },
  { label: "Refund requests", value: "0", delta: "No refund requests", tone: "neutral" },
  { label: "Platform commission", value: "$0", delta: "No commission yet", tone: "neutral" },
];

export const settingsSections = [
  {
    title: "Marketplace structure",
    description: "Control categories, subcategories, and homepage merchandising rules.",
    items: [],
  },
  {
    title: "Auction rules",
    description: "Set durations, reserve logic, extension behavior, and review states.",
    items: [],
  },
  {
    title: "Payments and wallets",
    description: "Manage wallets, payouts, and settlement rules.",
    items: [],
  },
  {
    title: "Notifications and support",
    description: "Manage templates, SLAs, canned responses, and support routing.",
    items: [],
  },
];

export const adminProfile = {
  name: "Admin",
  role: "Platform administrator",
  email: "Not set",
  location: "Not set",
  stats: [
    { label: "Cases handled", value: "0", delta: "No case history yet", tone: "neutral" },
    { label: "Critical actions", value: "0", delta: "No critical actions yet", tone: "neutral" },
    { label: "Admin sessions", value: "0", delta: "No recent sessions", tone: "neutral" },
    { label: "Risk reviews", value: "0", delta: "No reviews yet", tone: "neutral" },
  ],
  sections: [
    {
      title: "Identity",
      description: "Primary admin profile and control authority details.",
      items: [],
    },
    {
      title: "Security preferences",
      description: "Operational protection settings.",
      items: [],
    },
    {
      title: "Notification routing",
      description: "How critical marketplace alerts should reach the admin team.",
      items: [],
    },
    {
      title: "Audit preferences",
      description: "Visibility and logging configuration for sensitive actions.",
      items: [],
    },
  ],
};
