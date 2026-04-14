export const sellerOverview = {
  kpis: [
    { label: "Live listings", value: "24", delta: "+3 this week", tone: "good" },
    { label: "Active bidders", value: "136", delta: "+18%", tone: "good" },
    { label: "Gross sales", value: "$182K", delta: "+12.4%", tone: "good" },
    { label: "Pending payouts", value: "$16.8K", delta: "2 processing", tone: "warn" },
  ],
  activity: [
    { title: "Listing approved", meta: "Toyota Land Cruiser cleared moderation 14 minutes ago" },
    { title: "Auction heating up", meta: "Vintage Rolex passed 90 bids and entered final extension window" },
    { title: "Buyer question", meta: "Two new messages on the Dhaka Condo lot thread" },
  ],
  listings: [
    { id: "SL-101", title: "Toyota Land Cruiser", status: "Live", price: "$41,000", bids: "14" },
    { id: "SL-102", title: "Vintage Rolex 1968", status: "Featured", price: "$18,400", bids: "93" },
    { id: "SL-103", title: "Industrial lathe unit", status: "Pending review", price: "$12,250", bids: "0" },
  ],
  messages: [
    { title: "Payment confirmation needed", meta: "Winning bidder asks about release timing" },
    { title: "Shipping inquiry", meta: "Buyer requested packaging details for electronics lot" },
  ],
};

export const sellerListings = [
  { id: "SL-101", title: "Toyota Land Cruiser", category: "Vehicles", status: "Live", reserve: "Met", price: "$41,000", bids: "14" },
  { id: "SL-102", title: "Vintage Rolex 1968", category: "Collectibles", status: "Featured", reserve: "Met", price: "$18,400", bids: "93" },
  { id: "SL-103", title: "Industrial lathe unit", category: "Industrial", status: "Pending review", reserve: "Pending", price: "$12,250", bids: "0" },
  { id: "SL-104", title: "MacBook bundle", category: "Electronics", status: "Draft", reserve: "Not set", price: "$5,500", bids: "0" },
];

export const sellerAuctions = [
  { id: "SA-21", title: "Luxury sedan auction", stage: "Extended", currentBid: "$27,100", watchers: "49", ends: "18m" },
  { id: "SA-22", title: "Vintage Rolex 1968", stage: "Live", currentBid: "$18,400", watchers: "112", ends: "32m" },
  { id: "SA-23", title: "Dhaka Condo Lot", stage: "Scheduled", currentBid: "--", watchers: "28", ends: "Starts in 6h" },
];

export const sellerOrders = [
  { id: "SO-501", item: "Classic camera bundle", buyer: "Avery Stone", amount: "$4,200", status: "Awaiting payout" },
  { id: "SO-502", item: "Industrial lathe accessory set", buyer: "Mekon Traders", amount: "$1,850", status: "Completed" },
  { id: "SO-503", item: "Luxury sedan deposit", buyer: "Lima Estates", amount: "$7,000", status: "In escrow" },
];

export const sellerAnalytics = {
  views: [22, 31, 29, 36, 48, 52, 60],
  bids: [8, 12, 14, 18, 26, 24, 32],
  conversion: [12, 14, 18, 20, 25, 28, 30],
};

export const sellerWallet = {
  stats: [
    { label: "Available balance", value: "$24.8K", delta: "+$3.2K", tone: "good" },
    { label: "Pending payout", value: "$16.8K", delta: "2 orders", tone: "warn" },
    { label: "Escrow held", value: "$7.0K", delta: "1 order", tone: "warn" },
    { label: "Platform fees", value: "$2.3K", delta: "This month", tone: "neutral" },
  ],
};

export const bidderOverview = {
  kpis: [
    { label: "Active bids", value: "11", delta: "+4 today", tone: "good" },
    { label: "Watchlist items", value: "27", delta: "+6 this week", tone: "good" },
    { label: "Auctions won", value: "8", delta: "+2 this month", tone: "good" },
    { label: "Funds on hold", value: "$6.4K", delta: "3 auctions", tone: "warn" },
  ],
  activity: [
    { title: "Outbid alert", meta: "Luxury sedan auction moved above your last offer" },
    { title: "Watchlist spike", meta: "Vintage Rolex entered its final activity window" },
    { title: "Payment reminder", meta: "Deposit hold for the condo lot needs confirmation" },
  ],
  watchlist: [
    { id: "BW-81", title: "Vintage Rolex 1968", status: "Ending soon", currentBid: "$18,400", seller: "Heritage Vault" },
    { id: "BW-82", title: "Toyota Land Cruiser", status: "Live", currentBid: "$41,000", seller: "Prime Auto Gallery" },
    { id: "BW-83", title: "Dhaka Condo Lot", status: "Scheduled", currentBid: "--", seller: "Urban Estates" },
  ],
  messages: [
    { title: "Proof request update", meta: "Seller uploaded additional ownership documents" },
    { title: "Support reply", meta: "Wallet hold explanation received 9 minutes ago" },
  ],
};

export const bidderDiscover = [
  { id: "BD-11", title: "Classic motorbike", category: "Vehicles", stage: "New", price: "$8,100", interest: "High" },
  { id: "BD-12", title: "Luxury watch set", category: "Collectibles", stage: "Trending", price: "$12,900", interest: "Hot" },
  { id: "BD-13", title: "Commercial generator", category: "Industrial", stage: "Opportunity", price: "$15,400", interest: "Rising" },
];

export const bidderBids = [
  { id: "BB-401", auction: "Luxury sedan auction", yourBid: "$27,100", standing: "2nd place", status: "Outbid" },
  { id: "BB-402", auction: "Vintage Rolex 1968", yourBid: "$18,400", standing: "Leading", status: "Top bid" },
  { id: "BB-403", auction: "Industrial lathe unit", yourBid: "$12,250", standing: "Review hold", status: "Pending check" },
];

export const bidderWins = [
  { id: "BWN-91", item: "Camera collector set", seller: "Heritage Vault", amount: "$4,200", status: "Awaiting shipment" },
  { id: "BWN-92", item: "Office furniture lot", seller: "Workspace Depot", amount: "$2,880", status: "Paid" },
  { id: "BWN-93", item: "Industrial spare kit", seller: "Nexa Industrial", amount: "$1,050", status: "Delivered" },
];

export const bidderWallet = {
  stats: [
    { label: "Available funds", value: "$12.6K", delta: "+$1.4K", tone: "good" },
    { label: "Funds on hold", value: "$6.4K", delta: "3 auctions", tone: "warn" },
    { label: "Recent payments", value: "$4.2K", delta: "Last 30 days", tone: "neutral" },
    { label: "Refunds pending", value: "$480", delta: "1 case", tone: "warn" },
  ],
};

export const memberThreads = [
  {
    id: "MSG-101",
    subject: "Shipping timeline for camera set",
    priority: "Normal",
    status: "Open",
    participants: "Buyer + seller",
    lastMessage: "Seller confirmed dispatch within two business days.",
    messages: [
      { from: "Buyer", body: "Could you confirm the packaging and shipping timeline?" },
      { from: "Seller", body: "Yes, dispatch is scheduled within two business days with insured delivery." },
    ],
  },
  {
    id: "MSG-102",
    subject: "Wallet hold clarification",
    priority: "High",
    status: "Support active",
    participants: "Buyer + support",
    lastMessage: "Support explained the escrow hold release window.",
    messages: [
      { from: "Buyer", body: "Why is my balance still on hold after bidding?" },
      { from: "Support", body: "The hold remains until the auction state is finalized or your bid is released." },
    ],
  },
];
