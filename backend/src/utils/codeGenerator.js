/**
 * Generates unique prefixed codes for marketplace records.
 */
import crypto from "crypto";
import { ApiError } from "./apiError.js";

function randomInt(min, max) {
  return crypto.randomInt(min, max + 1);
}

export async function generateUniqueCode(model, prefix, { digits = 4, min = 1, attempts = 12 } = {}) {
  const max = Number("9".repeat(digits));

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = `${prefix}${String(randomInt(min, max)).padStart(digits, "0")}`;
    const exists = await model.exists({ code: candidate });

    if (!exists) {
      return candidate;
    }
  }

  throw new ApiError(503, "Could not generate a unique code. Please try again.");
}
