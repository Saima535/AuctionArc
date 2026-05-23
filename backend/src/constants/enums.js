/**
 * Central list of enum values shared across models, controllers, and services.
 */
export const USER_ROLES = ["Seller", "Bidder", "Admin"];
export const PUBLIC_ROLES = ["Seller", "Bidder"];
export const USER_STATUSES = [
  "Pending verification",
  "Active",
  "Flagged",
  "Suspended",
];
export const LISTING_STATUSES = [
  "Draft",
  "Pending approval",
  "Pending review",
  "Live",
  "Featured",
  "Rejected",
];
export const AUCTION_STATUSES = [
  "Scheduled",
  "Live",
  "Extended",
  "Closed",
  "Under review",
  "Paused",
];
export const BID_STATUSES = ["Valid", "Held", "Review", "Pending check", "Top bid", "Outbid"];
export const ORDER_STATUSES = ["Payment pending", "Paid", "Awaiting shipment", "Delivered", "Completed"];
export const THREAD_PRIORITIES = ["Low", "Normal", "Medium", "High"];
export const THREAD_STATUSES = ["Open", "Support active", "Escalated", "Resolved"];
