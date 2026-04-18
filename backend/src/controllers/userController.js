import { User } from "../models/User.js";
import { serializeUser, toStats } from "../services/mapperService.js";
import { uploadImageBuffer } from "../services/uploadService.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getCurrentProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const baseSections =
    user.role === "Seller"
      ? [
          {
            title: "Business profile",
            description: "Public-facing storefront identity and trust markers.",
            items: ["Store banner", "Business bio", "Verification badge"],
          },
          {
            title: "Contact details",
            description: "Internal and public communication settings for buyers.",
            items: ["Support phone", "Public email", "Preferred response window"],
          },
          {
            title: "Compliance documents",
            description: "Seller identity and ownership proof placeholders.",
            items: ["NID verification", "Business registration", "Ownership uploads"],
          },
          {
            title: "Visibility controls",
            description: "How your storefront and listings appear to bidders.",
            items: ["Featured appearance", "Profile highlights", "Trust metrics display"],
          },
        ]
      : user.role === "Bidder"
        ? [
            {
              title: "Personal profile",
              description: "Bidder identity, visibility, and account trust details.",
              items: ["Public bidder alias", "Verification badge", "Country and currency"],
            },
            {
              title: "Communication preferences",
              description: "How sellers and support teams can reach you.",
              items: ["Email alerts", "Bid outbid alerts", "Support reply notifications"],
            },
            {
              title: "Verification records",
              description: "Identity, wallet, and payment trust placeholders.",
              items: ["NID/ID record", "Wallet verification", "Payment method trust status"],
            },
            {
              title: "Buying preferences",
              description: "Auction discovery and category preference controls.",
              items: ["Saved categories", "Price range interest", "Auto-reminder settings"],
            },
          ]
        : [
            {
              title: "Identity",
              description: "Primary admin profile and control authority details.",
              items: ["Full control access", "Verified admin email", "Primary audit owner"],
            },
            {
              title: "Security preferences",
              description: "Operational protection settings prepared for backend integration.",
              items: ["Two-factor placeholder", "Session review", "Recovery contact"],
            },
            {
              title: "Notification routing",
              description: "How critical marketplace alerts should reach the super admin.",
              items: ["Fraud escalation alerts", "Dispute priority alerts", "Daily ops digest"],
            },
            {
              title: "Audit preferences",
              description: "Visibility and logging configuration for sensitive actions.",
              items: ["Action log export", "Approval notes", "Incident timeline visibility"],
            },
          ];

  const stats =
    user.role === "Seller"
      ? [
          toStats("Seller rating", `${user.stats.sellerRating || 0}/5`, "Trusted seller", "good"),
          toStats("Completed sales", String(user.stats.completedSales || 0), "+9 this month", "good"),
          toStats("Buyer response time", `${user.stats.buyerResponseMinutes || 0}m`, "-4m", "good"),
          toStats(
            "Verification status",
            user.verification.isIdentityVerified ? "100%" : "Pending",
            user.verification.isIdentityVerified ? "Complete" : "Reviewing",
            "good",
          ),
        ]
      : user.role === "Bidder"
        ? [
            toStats("Winning rate", `${user.stats.winningRate || 0}%`, "+6%", "good"),
            toStats("Watchlist growth", String(user.stats.watchlistGrowth || 0), "+6 items", "good"),
            toStats(
              "Verification status",
              user.verification.isIdentityVerified ? "Complete" : "Pending",
              "Trusted bidder",
              "good",
            ),
            toStats("Avg. bid response", `${user.stats.averageBidResponseMinutes || 0}m`, "Fast mover", "neutral"),
          ]
        : [
            toStats("Cases handled", String(user.stats.casesHandled || 0), "+18 this month", "good"),
            toStats("Critical actions", String(user.stats.criticalActions || 0), "Audited", "warn"),
            toStats("Admin sessions", String(user.stats.adminSessions || 0), "Last 30 days", "neutral"),
            toStats("Risk reviews", String(user.stats.riskReviews || 0), "+6 this week", "good"),
          ];

  res.json({
    success: true,
    data: {
      ...serializeUser(user),
      roleLabel: user.publicRoleLabel || user.role,
      stats,
      sections: baseSections,
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
      email: email.toLowerCase(),
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

  user.name = name || user.name;
  user.email = email ? email.toLowerCase() : user.email;
  user.location = location || user.location;
  user.contact = contact || user.contact;
  user.country = country || user.country;
  user.publicRoleLabel = publicRoleLabel || user.publicRoleLabel;
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
  user.preferences = {
    ...user.preferences.toObject(),
    ...req.body,
  };
  await user.save();

  res.json({
    success: true,
    message: "Settings updated successfully.",
    data: user.preferences,
  });
});
