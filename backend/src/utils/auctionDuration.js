/**
 * Normalizes, validates, converts, and formats auction duration values.
 */
import { ApiError } from "./apiError.js";

const DURATION_UNITS = ["minute", "day"];

export function normalizeAuctionDurationUnit(unit) {
  const normalized = String(unit || "day").trim().toLowerCase();

  if (!DURATION_UNITS.includes(normalized)) {
    throw new ApiError(400, `Auction duration unit must be one of: ${DURATION_UNITS.join(", ")}.`);
  }

  return normalized;
}

export function parseAuctionDurationValue(value, unit = "day") {
  const normalizedUnit = normalizeAuctionDurationUnit(unit);
  const parsed = Number(value);
  const max = normalizedUnit === "minute" ? 180 : 30;

  if (Number.isNaN(parsed) || parsed < 1 || parsed > max) {
    throw new ApiError(
      400,
      normalizedUnit === "minute"
        ? "Auction duration must be between 1 and 180 minutes."
        : "Auction duration must be between 1 and 30 days.",
    );
  }

  return parsed;
}

export function auctionDurationToMs(value, unit = "day") {
  const normalizedUnit = normalizeAuctionDurationUnit(unit);

  if (normalizedUnit === "minute") {
    return value * 60 * 1000;
  }

  return value * 24 * 60 * 60 * 1000;
}

export function addAuctionDuration(startAt, value, unit = "day") {
  return new Date(startAt.getTime() + auctionDurationToMs(value, unit));
}

export function formatAuctionDuration(value, unit = "day") {
  const normalizedUnit = normalizeAuctionDurationUnit(unit);
  const suffix =
    normalizedUnit === "minute"
      ? value === 1
        ? "minute"
        : "minutes"
      : value === 1
        ? "day"
        : "days";

  return `${value} ${suffix}`;
}
