export const adminOverview = {
  kpis: [
    { label: "Active auctions", value: "148", delta: "+12%", tone: "good" },
    { label: "Verified sellers", value: "1,284", delta: "+8.4%", tone: "good" },
    { label: "Bid volume today", value: "$92.4K", delta: "+16.1%", tone: "good" },
    { label: "Open disputes", value: "19", delta: "-3 cases", tone: "warn" },
  ],
  alerts: [
    { title: "Suspicious bid cluster", body: "4 accounts repeatedly bidding on the same vintage watch listing.", level: "high" },
    { title: "Support backlog rising", body: "Support queue exceeded the target SLA for the first time this week.", level: "medium" },
    { title: "Pending verification wave", body: "37 new sellers are waiting for KYC review before listing approval.", level: "low" },
  ],
  activity: [
    { title: "Seller verified", meta: "Farzana Traders approved 8 minutes ago" },
    { title: "Auction extended", meta: "Luxury sedan auction extended by 15 minutes due to bid activity" },
    { title: "Dispute escalated", meta: "Case DSP-203 routed to admin review with high priority" },
    { title: "Listing rejected", meta: "Antique coin lot rejected for incomplete provenance details" },
  ],
  categories: [
    { label: "Vehicles", value: 82 },
    { label: "Electronics", value: 68 },
    { label: "Collectibles", value: 57 },
    { label: "Property", value: 36 },
    { label: "Industrial", value: 28 },
  ],
  registrations: [
    { name: "M. Rahman", role: "Seller", country: "Bangladesh", status: "Pending verification" },
    { name: "Avery Stone", role: "Bidder", country: "United States", status: "Active" },
    { name: "Sadia Ventures", role: "Seller", country: "Bangladesh", status: "Flagged" },
  ],
  supportQueue: [
    { queue: "Disputes", open: "07", sla: "1h 10m", status: "Attention needed" },
    { queue: "Payments", open: "05", sla: "42m", status: "Healthy" },
    { queue: "Account reviews", open: "14", sla: "2h 05m", status: "Busy" },
  ],
};

export const insightSeries = {
  marketplaceGrowth: [28, 35, 34, 41, 50, 57, 63],
  bidVolume: [44, 39, 55, 71, 66, 74, 82],
  conversion: [18, 22, 20, 29, 33, 35, 38],
  fraudSignals: [12, 10, 14, 9, 8, 7, 6],
};

export const insightCards = [
  { label: "Gross marketplace activity", value: "$1.84M", delta: "+14.2%", tone: "good" },
  { label: "Average auction completion", value: "73%", delta: "+4.1%", tone: "good" },
  { label: "Fraud review rate", value: "1.8%", delta: "-0.4%", tone: "good" },
  { label: "Support resolution time", value: "46m", delta: "+6m", tone: "warn" },
];

export const topPerformers = {
  sellers: [
    { name: "Prime Auto Gallery", metric: "$214K volume", status: "Top seller" },
    { name: "Heritage Vault", metric: "$182K volume", status: "Trusted" },
    { name: "Nexa Industrial", metric: "$141K volume", status: "Rising" },
  ],
  categories: [
    { name: "Vehicles", metric: "28% share", status: "Leading" },
    { name: "Luxury goods", metric: "21% share", status: "Growing" },
    { name: "Electronics", metric: "18% share", status: "Stable" },
  ],
  products: [
    { name: "Vintage Rolex 1968", metric: "93 bids", status: "Trending" },
    { name: "Toyota Land Cruiser", metric: "$48K current", status: "Hot" },
    { name: "Industrial lathe unit", metric: "22 bidders", status: "High intent" },
  ],
};

export const usersData = [
  { id: "USR-1021", name: "M. Rahman", role: "Seller", status: "Pending verification", country: "Bangladesh", contact: "+8801711000001", joined: "2026-04-10", lastSeen: "12m ago" },
  { id: "USR-1022", name: "Avery Stone", role: "Bidder", status: "Active", country: "United States", contact: "+12025550191", joined: "2026-04-05", lastSeen: "5m ago" },
  { id: "USR-1023", name: "Sadia Ventures", role: "Seller", status: "Flagged", country: "Bangladesh", contact: "+8801711000002", joined: "2026-03-29", lastSeen: "1h ago" },
  { id: "USR-1024", name: "Ethan Brooks", role: "Bidder", status: "Suspended", country: "United Kingdom", contact: "+447911123456", joined: "2026-03-22", lastSeen: "2d ago" },
];

export const featuredUser = {
  name: "M. Rahman",
  role: "Seller",
  status: "Pending verification",
  notes: [
    "Submitted NID and wallet details but requires manual birthdate match review.",
    "Preparing first vehicle listing with estimated reserve value of $19.5K.",
    "Support asked for one more proof-of-ownership document.",
  ],
};

export const productsData = [
  { id: "PRD-991", title: "Vintage Rolex 1968", seller: "Heritage Vault", category: "Collectibles", status: "Live", price: "$18,400", bids: "93" },
  { id: "PRD-992", title: "Toyota Land Cruiser", seller: "Prime Auto Gallery", category: "Vehicles", status: "Pending approval", price: "$41,000", bids: "14" },
  { id: "PRD-993", title: "Industrial lathe unit", seller: "Nexa Industrial", category: "Industrial", status: "Featured", price: "$12,250", bids: "22" },
  { id: "PRD-994", title: "Smartphone bundle", seller: "Tech Harbor", category: "Electronics", status: "Rejected", price: "$2,100", bids: "0" },
];

export const featuredProduct = {
  title: "Toyota Land Cruiser",
  seller: "Prime Auto Gallery",
  status: "Pending approval",
  notes: [
    "Seller verification complete, pending image quality review.",
    "Reserve price set 8% above recent auction benchmark.",
    "Recommended action: approve after VIN proof is attached.",
  ],
};

export const auctionsData = [
  { id: "AUC-401", title: "Dhaka Condo Lot", status: "Live", reserve: "Met", countdown: "00:12:34", bids: "57" },
  { id: "AUC-402", title: "Luxury Sedan Auction", status: "Extended", reserve: "Near", countdown: "00:18:11", bids: "63" },
  { id: "AUC-403", title: "Antique Coin Set", status: "Scheduled", reserve: "Pending", countdown: "Starts in 4h", bids: "0" },
  { id: "AUC-404", title: "Server Rack Inventory", status: "Under review", reserve: "Held", countdown: "Paused", bids: "11" },
];

export const bidsData = [
  { id: "BID-7101", auction: "Vintage Rolex 1968", bidder: "Avery Stone", amount: "$18,400", status: "Valid", signal: "Normal" },
  { id: "BID-7102", auction: "Luxury Sedan Auction", bidder: "Ethan Brooks", amount: "$27,100", status: "Held", signal: "Velocity spike" },
  { id: "BID-7103", auction: "Dhaka Condo Lot", bidder: "Lima Estates", amount: "$93,000", status: "Valid", signal: "High intent" },
  { id: "BID-7104", auction: "Industrial lathe unit", bidder: "Mekon Traders", amount: "$12,250", status: "Review", signal: "Duplicate IP" },
];

export const chatThreads = [
  {
    id: "CHT-301",
    subject: "Payment delay after winning bid",
    priority: "High",
    status: "Escalated",
    participants: "Bidder + seller",
    lastMessage: "Buyer says wallet debit completed but seller has not received payout.",
    messages: [
      { from: "Bidder", body: "My wallet was charged but the seller still shows unpaid." },
      { from: "Support", body: "We are checking settlement state and escrow release logs." },
      { from: "Admin note", body: "Mark finance review if payout remains pending after next sync window." },
    ],
  },
  {
    id: "CHT-302",
    subject: "Listing authenticity complaint",
    priority: "Medium",
    status: "Open",
    participants: "Bidder + moderation",
    lastMessage: "Requesting documentation for collectible watch provenance.",
    messages: [
      { from: "Bidder", body: "I need authenticity proof before I continue bidding." },
      { from: "Moderation", body: "Seller has been asked to upload provenance documents." },
    ],
  },
];

export const reportsData = [
  { id: "RPT-501", type: "Fraud", target: "User USR-1023", severity: "High", status: "Investigating", owner: "Super Admin" },
  { id: "RPT-502", type: "Listing complaint", target: "Product PRD-994", severity: "Medium", status: "Queued", owner: "Moderation" },
  { id: "RPT-503", type: "Bid dispute", target: "Auction AUC-402", severity: "High", status: "Escalated", owner: "Support" },
  { id: "RPT-504", type: "Abuse report", target: "Chat CHT-302", severity: "Low", status: "Resolved", owner: "Support" },
];

export const transactionsData = [
  { id: "TXN-8801", user: "Avery Stone", type: "Wallet debit", status: "Completed", amount: "$2,400", channel: "Wallet" },
  { id: "TXN-8802", user: "Prime Auto Gallery", type: "Seller payout", status: "Pending", amount: "$18,900", channel: "Bank transfer" },
  { id: "TXN-8803", user: "M. Rahman", type: "Registration fee", status: "Completed", amount: "$25", channel: "Card" },
  { id: "TXN-8804", user: "Heritage Vault", type: "Refund", status: "Review", amount: "$480", channel: "Escrow" },
];

export const transactionStats = [
  { label: "Wallet balance in motion", value: "$426K", delta: "+11%", tone: "good" },
  { label: "Pending payouts", value: "$74K", delta: "12 sellers", tone: "warn" },
  { label: "Refund requests", value: "9", delta: "+2 today", tone: "warn" },
  { label: "Platform commission", value: "$36.8K", delta: "+9.3%", tone: "good" },
];

export const settingsSections = [
  {
    title: "Marketplace structure",
    description: "Control categories, subcategories, and homepage merchandising rules.",
    items: ["Category manager", "Featured listing slots", "Homepage banner rotation"],
  },
  {
    title: "Auction rules",
    description: "Set durations, reserve logic, extension behavior, and review states.",
    items: ["Default auction duration", "Reserve threshold policy", "Auto-extension window"],
  },
  {
    title: "Payments and wallets",
    description: "Prepare the control surface for wallet providers, payouts, and escrow.",
    items: ["Wallet provider config", "Commission rates", "Payout release rules"],
  },
  {
    title: "Notifications and support",
    description: "Manage templates, SLA targets, canned responses, and support routing.",
    items: ["Email/SMS templates", "Dispute routing", "Support escalation policy"],
  },
];
