"use client";

import { clearStoredToken, getApiBaseUrl, getStoredToken } from "@/lib/auth";

async function parseJson(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The server returned an invalid response.");
  }
}

export async function apiRequest(path, options = {}) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    throw new Error("Frontend configuration is missing NEXT_PUBLIC_API_BASE_URL.");
  }

  const {
    method = "GET",
    body,
    headers = {},
    auth = true,
  } = options;

  const requestHeaders = { ...headers };
  const token = auth ? getStoredToken() : null;

  if (auth && token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (body && !isFormData && !requestHeaders["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const result = await parseJson(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredToken();
    }

    throw new Error(result.message || "Request failed.");
  }

  return result;
}
