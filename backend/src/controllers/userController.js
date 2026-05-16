import { Auction } from "../models/Auction.js";
import { Bid } from "../models/Bid.js";
import { Listing } from "../models/Listing.js";
import { Order } from "../models/Order.js";
import { Report } from "../models/Report.js";
import { Thread } from "../models/Thread.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { Watchlist } from "../models/Watchlist.js";
import { serializeUser, toStats } from "../services/mapperService.js";
import { uploadImageBuffer } from "../services/uploadService.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  assertEmail,
  assertOptionalText,
  assertRequiredText,
  pickAllowedKeys,
} from "../utils/validation.js";

async function buildSellerProfileContext(user) {
  const [listings, orders, threads] = await Promise.all([
    Listing.find({ seller: user._id }).select("status"),
    Order.find({ seller: user._id }).select("status"),
    Thread.find({ "participants.user": user._id }).select("status"),
  ]);

  const activeListings = listings.filter((item) => ["Live", "Featured"].includes(item.status)).length;
  const pendingListings = listings.filter((item) => ["Pending approval", "Pending review", "Draft"].includes(item.status)).length;
  const completedSales = orders.filter((item) => ["Completed", "Paid", "Delivered"].includes(item.status)).length;
  const openThreads = threads.filter((item) => ["Open", "Support active", "Escalated"].includes(item.status)).length;

  return {
    stats: [
      toStats("Active listings", String(activeListings), `${pendingListings} pending`, activeListings ? "good" : "neutral"),
      toStats("Completed sales", String(completedSales), `${orders.length} total orders`, completedSales ? "good" : "neutral"),
      toStats("Open conversations", String(openThreads), user.preferences.responseWindow || "Within 1 hour", openThreads ? "warn" : "good"),
      toStats(
        "Verification",
        user.verification.isIdentityVerified ? "Verified" : "Pending",
        user.verification.isWalletVerified ? "Wallet ready" : "Wallet review",
        user.verification.isIdentityVerified ? "good" : "warn",
      ),
    ],
    sections: [
      {
        title: "Business profile",
        description: "Public-facing storefront identity and trust markers.",
        items: [
          `Store label: ${user.publicRoleLabel || "Seller"}`,
          `Identity verification: ${user.verification.isIdentityVerified ? "Verified" : "Pending"}`,
          `Seller rating: ${user.stats.sellerRating || 0}/5`,
        ],
      },
      {
        title: "Contact details",
        description: "Internal and public communication settings for buyers.",
        items: [
          `Public email: ${user.email}`,
          `Contact number: ${user.contact || "Not provided"}`,
          `Response window: ${user.preferences.responseWindow || "Within 1 hour"}`,
        ],
      },
      {
        title: "Compliance documents",
        description: "Seller identity and ownership proof status.",
        items: [
          `Adult verification: ${user.verification.isAdultVerified ? "Verified" : "Pending"}`,
          `Identity verification: ${user.verification.isIdentityVerified ? "Verified" : "Pending"}`,
          `Wallet verification: ${user.verification.isWalletVerified ? "Verified" : "Pending"}`,
        ],
      },
      {
        title: "Visibility controls",
        description: "How your storefront and listings appear to buyers.",
        items: [
          `Featured appearance: ${user.preferences.featuredAppearance || "Enabled"}`,
          `Active listings: ${activeListings}`,
          `Pending listings: ${pendingListings}`,
        ],
      },
    ],
  };
}

async function buildBidderProfileContext(user) {
  const [bids, watchlist, orders, threads] = await Promise.all([
    Bid.find({ bidder: user._id }).select("status"),
    Watchlist.find({ user: user._id }).select("_id"),
    Order.find({ bidder: user._id }).select("status"),
    Thread.find({ "participants.user": user._id }).select("status"),
  ]);

  const leadingBids = bids.filter((item) => item.status === "Top bid").length;
  const reviewBids = bids.filter((item) => ["Held", "Review", "Pending check"].includes(item.status)).length;
  const wonOrders = orders.filter((item) => ["Completed", "Paid", "Delivered", "Awaiting shipment", "In escrow"].includes(item.status)).length;
  const openThreads = threads.filter((item) => ["Open", "Support active", "Escalated"].includes(item.status)).length;

  return {
    stats: [
      toStats("Active bids", String(bids.length), `${leadingBids} leading`, bids.length ? "good" : "neutral"),
      toStats("Watchlist items", String(watchlist.length), `${user.stats.watchlistGrowth || 0} recent growth`, watchlist.length ? "good" : "neutral"),
      toStats("Won auctions", String(wonOrders), `${openThreads} active threads`, wonOrders ? "good" : "neutral"),
      toStats(
        "Verification",
        user.verification.isIdentityVerified ? "Verified" : "Pending",
        `${reviewBids} bids under review`,
        user.verification.isIdentityVerified ? "good" : "warn",
      ),
    ],
    sections: [
      {
        title: "Personal profile",
        description: "Buyer identity, visibility, and account trust details.",
        items: [
          `Display name: ${user.name}`,
          `Buyer label: ${String(user.publicRoleLabel || "Buyer").replace(/bidder/gi, "buyer")}`,
          `Country: ${user.country || "Not set"}`,
        ],
      },
      {
        title: "Communication preferences",
        description: "How sellers and support teams can reach you.",
        items: [
          `Outbid alerts: ${user.preferences.outbidAlerts || "Instant"}`,
          `Support alerts: ${user.preferences.supportAlerts || "Enabled"}`,
          `Email alerts: ${user.preferences.emailAlerts || "Enabled"}`,
        ],
      },
      {
        title: "Verification records",
        description: "Identity, wallet, and payment trust status.",
        items: [
          `Adult verification: ${user.verification.isAdultVerified ? "Verified" : "Pending"}`,
          `Identity verification: ${user.verification.isIdentityVerified ? "Verified" : "Pending"}`,
          `Wallet verification: ${user.verification.isWalletVerified ? "Verified" : "Pending"}`,
        ],
      },
      {
        title: "Buying preferences",
        description: "Auction discovery and category preference controls.",
        items: [
          `Category focus: ${user.preferences.categoryFocus || "General"}`,
          `Preferred currency: ${user.preferences.currency || "USD"}`,
          `Watchlist items: ${watchlist.length}`,
        ],
      },
    ],
  };
}

async function buildAdminProfileContext(user) {
  const [pendingSellers, reports, transactions, listings, threads] = await Promise.all([
    User.countDocuments({ role: "Seller", status: "Pending verification" }),
    Report.find({}).select("status"),
    Transaction.countDocuments({}),
    Listing.countDocuments({}),
    Thread.find({ status: { $in: ["Open", "Support active", "Escalated"] } }).select("status"),
  ]);

  const openReports = reports.filter((item) => ["Investigating", "Escalated", "Queued"].includes(item.status)).length;

  return {
    stats: [
      toStats("Pending seller reviews", String(pendingSellers), "Verification queue", pendingSellers ? "warn" : "good"),
      toStats("Open disputes", String(openReports), `${threads.length} active threads`, openReports ? "warn" : "good"),
      toStats("Marketplace listings", String(listings), `${transactions} transactions tracked`, listings ? "good" : "neutral"),
      toStats("Admin sessions", String(user.stats.adminSessions || 0), `${user.preferences.sessionTimeout || "30 minutes"} timeout`, "neutral"),
    ],
    sections: [
      {
        title: "Identity",
        description: "Primary admin profile and control authority details.",
        items: [
          `Admin title: ${user.publicRoleLabel || "Administrator"}`,
          `Audit email: ${user.preferences.auditEmail || user.email}`,
          `Location: ${user.location || "Not set"}`,
        ],
      },
      {
        title: "Security preferences",
        description: "Operational protection settings for the admin workspace.",
        items: [
          `Two-factor mode: ${user.preferences.twoFactorMode || "Enabled"}`,
          `Session timeout: ${user.preferences.sessionTimeout || "30 minutes"}`,
          `Status: ${user.status}`,
        ],
      },
      {
        title: "Notification routing",
        description: "How critical marketplace alerts should reach the super admin.",
        items: [
          `${pendingSellers} seller reviews awaiting action`,
          `${openReports} reports require attention`,
          `${threads.length} active support threads`,
        ],
      },
      {
        title: "Audit preferences",
        description: "Visibility and logging configuration for sensitive actions.",
        items: [
          `${transactions} transactions recorded`,
          `${listings} listings in marketplace scope`,
          `${user.stats.criticalActions || 0} critical actions logged`,
        ],
      },
    ],
  };
}

export const getCurrentProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const profileContext =
    user.role === "Seller"
      ? await buildSellerProfileContext(user)
      : user.role === "Bidder"
        ? await buildBidderProfileContext(user)
        : await buildAdminProfileContext(user);

  res.json({
    success: true,
    data: {
      ...serializeUser(user),
      roleLabel: user.publicRoleLabel || user.role,
      stats: profileContext.stats,
      sections: profileContext.sections,
    },
  });
});

export const updateCurrentProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const { name, email, location, contact, publicRoleLabel, country } = req.body;

  if (email && email !== user.email) {
    const exists = await User.findOne({
      email: assertEmail(email),
      _id: { $ne: user._id },
    });

    if (exists) {
      throw new ApiError(409, "Another account already uses that email.");
    }
  }

  if (req.file) {
    user.profilePicture = await uploadImageBuffer(
      req.file.buffer,
      "auctionarc/profile-pictures",
      `${user.email.replace(/[^a-z0-9]/g, "-")}-${Date.now()}`,
    );
  }

  user.name = name ? assertRequiredText(name, "Name", { maxLength: 120 }) : user.name;
  user.email = email ? assertEmail(email) : user.email;
  user.location = location ? assertOptionalText(location, "Location", { maxLength: 120 }) : user.location;
  user.contact = contact ? assertOptionalText(contact, "Contact number", { maxLength: 40 }) : user.contact;
  user.country = country ? assertOptionalText(country, "Country", { maxLength: 120 }) : user.country;
  user.publicRoleLabel = publicRoleLabel
    ? assertOptionalText(publicRoleLabel, "Public role label", { maxLength: 80 })
    : user.publicRoleLabel;
  await user.save();

  res.json({
    success: true,
    message: "Profile updated successfully.",
    data: serializeUser(user),
  });
});

export const getCurrentSettings = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user.preferences,
  });
});

export const updateCurrentSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const allowedSettings = [
    "emailAlerts",
    "payoutAlerts",
    "messageAlerts",
    "outbidAlerts",
    "endingAlerts",
    "supportAlerts",
    "currency",
    "walletMode",
    "categoryFocus",
    "responseWindow",
    "featuredAppearance",
    "defaultAuctionDuration",
    "defaultShipping",
    "reserveReminder",
    "twoFactorMode",
    "sessionTimeout",
    "auditEmail",
  ];
  const incomingPreferences = pickAllowedKeys(req.body, allowedSettings);

  if (incomingPreferences.auditEmail) {
    incomingPreferences.auditEmail = assertEmail(incomingPreferences.auditEmail);
  }

  user.preferences = {
    ...user.preferences.toObject(),
    ...incomingPreferences,
  };
  await user.save();

  res.json({
    success: true,
    message: "Settings updated successfully.",
    data: user.preferences,
  });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Both current and new passwords are required.");
  }

  const { comparePassword, hashPassword } = await import("../utils/security.js");
  const { assertPassword } = await import("../utils/validation.js");

  const matches = await comparePassword(currentPassword, user.passwordHash);

  if (!matches) {
    throw new ApiError(401, "Current password is incorrect.");
  }

  assertPassword(newPassword);

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  res.json({ success: true, message: "Password updated successfully." });
});
