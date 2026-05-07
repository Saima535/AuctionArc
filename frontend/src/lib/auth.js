"use client";

export const AUTH_TOKEN_KEY = "auctionarc_token";
export const AUTH_EVENT_NAME = "auctionarc-auth-change";

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL;
}

function emitAuthChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
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
  emitAuthChange();
}

export function clearStoredToken() {
  if (typeof window === "undefined") {
    return;
  }

  const hadToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_TOKEN_KEY);

  if (hadToken) {
    emitAuthChange();
  }
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
    const error = new Error(result.message || "Could not verify your session.");
    error.status = response.status;
    throw error;
  }

  return result.data;
}
