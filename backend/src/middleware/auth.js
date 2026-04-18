import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/User.js";

async function resolveUser(req) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    throw new ApiError(401, "Authorization token is required.");
  }

  const token = header.replace("Bearer ", "").trim();
  const payload = jwt.verify(token, env.jwtSecret);
  const user = await User.findById(payload.userId);

  if (!user) {
    throw new ApiError(401, "The authenticated user no longer exists.");
  }

  req.user = user;
}

export async function requireAuth(req, res, next) {
  try {
    await resolveUser(req);
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  return async function guard(req, res, next) {
    try {
      await resolveUser(req);

      if (!roles.includes(req.user.role)) {
        throw new ApiError(403, "You do not have permission to access this resource.");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
