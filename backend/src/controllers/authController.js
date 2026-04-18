import { sendMail } from "../config/mailer.js";
import { PUBLIC_ROLES } from "../constants/enums.js";
import { User } from "../models/User.js";
import { uploadImageBuffer } from "../services/uploadService.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  comparePassword,
  createTokenHash,
  generateNumericCode,
  hashPassword,
  signToken,
} from "../utils/security.js";

function isAdult(birthdate) {
  const today = new Date();
  const adultDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );

  return new Date(birthdate) <= adultDate;
}

function buildAuthResponse(user) {
  const token = signToken({ userId: user._id, role: user.role });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      profilePicture: user.profilePicture || null,
    },
    destination:
      user.role === "Seller" ? "/seller" : user.role === "Bidder" ? "/bidder" : "/admin",
  };
}

export const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    role,
    gender,
    nid,
    birthdate,
    country,
    contact,
    wallet,
    password,
    confirmPassword,
    humanVerification,
  } = req.body;

  if (!name || !email || !role || !birthdate || !password || !confirmPassword) {
    throw new ApiError(400, "Please complete all required registration fields.");
  }

  if (!PUBLIC_ROLES.includes(role)) {
    throw new ApiError(400, "Only seller and bidder public registrations are allowed.");
  }

  if (!isAdult(birthdate)) {
    throw new ApiError(400, "Only users aged 18 or older can register.");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Password confirmation does not match.");
  }

  if (humanVerification?.trim().toLowerCase() !== "i am human") {
    throw new ApiError(400, "Human verification failed.");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    throw new ApiError(409, "An account with that email already exists.");
  }

  const profilePicture = req.file
    ? await uploadImageBuffer(
        req.file.buffer,
        "auctionarc/profile-pictures",
        `${email.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`,
      )
    : null;

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: await hashPassword(password),
    role,
    publicRoleLabel: role === "Seller" ? "Verified seller" : "Active bidder",
    status: role === "Seller" ? "Pending verification" : "Active",
    gender,
    nid,
    birthdate,
    country,
    location: country,
    contact,
    wallet: {
      availableBalance: 0,
      heldBalance: 0,
      pendingPayout: 0,
      platformFees: 0,
      walletLabel: wallet,
    },
    profilePicture,
    verification: {
      isAdultVerified: true,
      isIdentityVerified: false,
      isWalletVerified: false,
    },
  });

  await sendMail({
    to: user.email,
    subject: "Welcome to AuctionArc",
    text: `Hi ${user.name}, your ${user.role.toLowerCase()} account has been created successfully.`,
  });

  res.status(201).json({
    success: true,
    message: "Registration completed successfully.",
    data: buildAuthResponse(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    throw new ApiError(400, "Email, password, and role are required.");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (user.role !== role) {
    throw new ApiError(403, "The selected role does not match this account.");
  }

  const passwordMatches = await comparePassword(password, user.password);

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password.");
  }

  user.lastSeenAt = new Date();
  await user.save();

  res.json({
    success: true,
    message: "Login successful.",
    data: buildAuthResponse(user),
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    throw new ApiError(400, "Email and role are required.");
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    role,
  });

  if (!user) {
    throw new ApiError(404, "No account matched the provided email and role.");
  }

  const code = generateNumericCode(6);

  user.resetPasswordCodeHash = createTokenHash(code);
  user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  const delivery = await sendMail({
    to: user.email,
    subject: "AuctionArc password reset code",
    text: `Your password reset code is ${code}. It expires in 15 minutes.`,
  });

  res.json({
    success: true,
    message: "Password reset instructions have been generated.",
    data: {
      email: user.email,
      role: user.role,
      delivery,
      developmentCode: process.env.NODE_ENV === "production" ? undefined : code,
    },
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { code, password, confirmPassword } = req.body;

  if (!code || !password || !confirmPassword) {
    throw new ApiError(400, "Reset code and new password are required.");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Password confirmation does not match.");
  }

  const user = await User.findOne({
    resetPasswordCodeHash: createTokenHash(code),
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select("+password");

  if (!user) {
    throw new ApiError(400, "Reset code is invalid or expired.");
  }

  user.password = await hashPassword(password);
  user.resetPasswordCodeHash = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();

  res.json({
    success: true,
    message: "Password reset completed successfully.",
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: buildAuthResponse(user),
  });
});
