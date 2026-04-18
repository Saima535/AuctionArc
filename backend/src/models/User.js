import mongoose from "mongoose";
import { PUBLIC_ROLES, USER_ROLES, USER_STATUSES } from "../constants/enums.js";

const imageSchema = new mongoose.Schema(
  {
    publicId: String,
    url: String,
  },
  { _id: false },
);

const userPreferenceSchema = new mongoose.Schema(
  {
    emailAlerts: { type: String, default: "Enabled" },
    payoutAlerts: { type: String, default: "Enabled" },
    messageAlerts: { type: String, default: "Instant" },
    outbidAlerts: { type: String, default: "Instant" },
    endingAlerts: { type: String, default: "Enabled" },
    supportAlerts: { type: String, default: "Enabled" },
    currency: { type: String, default: "USD" },
    walletMode: { type: String, default: "Manual" },
    categoryFocus: { type: String, default: "Vehicles, Collectibles" },
    responseWindow: { type: String, default: "Within 1 hour" },
    featuredAppearance: { type: String, default: "Enabled" },
    defaultAuctionDuration: { type: String, default: "7 days" },
    defaultShipping: { type: String, default: "Standard insured shipping" },
    reserveReminder: { type: String, default: "Enabled" },
    twoFactorMode: { type: String, default: "Enabled" },
    sessionTimeout: { type: String, default: "30 minutes" },
    auditEmail: String,
  },
  { _id: false },
);

const walletSchema = new mongoose.Schema(
  {
    availableBalance: { type: Number, default: 0 },
    heldBalance: { type: Number, default: 0 },
    pendingPayout: { type: Number, default: 0 },
    platformFees: { type: Number, default: 0 },
    walletLabel: String,
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
    },
    publicRoleLabel: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: "Active",
    },
    gender: String,
    birthdate: Date,
    country: String,
    location: String,
    contact: String,
    nid: String,
    profilePicture: imageSchema,
    preferences: {
      type: userPreferenceSchema,
      default: () => ({}),
    },
    wallet: {
      type: walletSchema,
      default: () => ({}),
    },
    verification: {
      isAdultVerified: { type: Boolean, default: false },
      isIdentityVerified: { type: Boolean, default: false },
      isWalletVerified: { type: Boolean, default: false },
    },
    stats: {
      sellerRating: { type: Number, default: 4.9 },
      completedSales: { type: Number, default: 0 },
      buyerResponseMinutes: { type: Number, default: 18 },
      winningRate: { type: Number, default: 28 },
      watchlistGrowth: { type: Number, default: 0 },
      averageBidResponseMinutes: { type: Number, default: 11 },
      casesHandled: { type: Number, default: 0 },
      criticalActions: { type: Number, default: 0 },
      adminSessions: { type: Number, default: 0 },
      riskReviews: { type: Number, default: 0 },
    },
    resetPasswordCodeHash: String,
    resetPasswordExpiresAt: Date,
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ role: 1, status: 1 });

userSchema.virtual("joinedDate").get(function joinedDate() {
  return this.createdAt;
});

userSchema.methods.isPublicUser = function isPublicUser() {
  return PUBLIC_ROLES.includes(this.role);
};

export const User = mongoose.model("User", userSchema);
