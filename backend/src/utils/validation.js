import { ApiError } from "./apiError.js";

export function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function assertRequiredText(value, label, { maxLength = 200 } = {}) {
  const normalized = cleanString(value);

  if (!normalized) {
    throw new ApiError(400, `${label} is required.`);
  }

  if (normalized.length > maxLength) {
    throw new ApiError(400, `${label} must be ${maxLength} characters or fewer.`);
  }

  return normalized;
}

export function assertOptionalText(value, label, { maxLength = 200 } = {}) {
  const normalized = cleanString(value);

  if (!normalized) {
    return "";
  }

  if (normalized.length > maxLength) {
    throw new ApiError(400, `${label} must be ${maxLength} characters or fewer.`);
  }

  return normalized;
}

export function assertEmail(value) {
  const normalized = cleanString(value).toLowerCase();

  if (!normalized) {
    throw new ApiError(400, "Email is required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new ApiError(400, "Please provide a valid email address.");
  }

  return normalized;
}

export function assertPassword(value) {
  if (typeof value !== "string" || value.length < 8 || value.length > 72) {
    throw new ApiError(400, "Password must be between 8 and 72 characters.");
  }

  return value;
}

export function assertNumber(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < min || parsed > max) {
    throw new ApiError(400, `${label} must be between ${min} and ${max}.`);
  }

  return parsed;
}

export function assertOneOf(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw new ApiError(400, `${label} must be one of: ${allowed.join(", ")}.`);
  }

  return value;
}

export function pickAllowedKeys(source, allowedKeys) {
  return Object.fromEntries(
    Object.entries(source || {}).filter(([key]) => allowedKeys.includes(key)),
  );
}
