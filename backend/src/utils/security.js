import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

export function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpire,
  });
}

export function generateNumericCode(length = 6) {
  return Array.from({ length }, () => crypto.randomInt(0, 10)).join("");
}

export function createTokenHash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
