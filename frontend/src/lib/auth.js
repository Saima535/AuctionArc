"use client";

export const AUTH_TOKEN_KEY = "auctionarc_token";

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL;
}

export function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function storeToken(token) {
  if (typeof window === "undefined" || !token) {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function fetchCurrentUser(token) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    throw new Error("AuctionArc frontend is missing NEXT_PUBLIC_API_BASE_URL.");
  }

  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Could not verify your session.");
  }

  return result.data;
}
