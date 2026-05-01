"use client";

import { storeToken } from "@/lib/auth";
import { apiRequest } from "@/lib/api";

const ROLE_DESTINATIONS = {
  Admin: "/admin",
  Seller: "/seller",
  Bidder: "/bidder/discover",
};

function getDestination(result, role) {
  return result.data?.destination || ROLE_DESTINATIONS[role] || "/login";
}

function finalizeAuth(result) {
  if (result.data?.token) {
    storeToken(result.data.token);
  }

  return result;
}

export async function loginUser({ email, password, role }) {
  const result = await apiRequest("/auth/login", {
    method: "POST",
    auth: false,
    body: {
      email,
      password,
      role,
    },
  });

  finalizeAuth(result);

  return {
    ...result,
    destination: getDestination(result, role),
  };
}

export async function registerUser(formData) {
  const role = formData.get("role");
  const result = await apiRequest("/auth/register", {
    method: "POST",
    auth: false,
    body: formData,
  });

  finalizeAuth(result);

  return {
    ...result,
    destination: getDestination(result, role),
  };
}

export async function requestPasswordReset({ email, role }) {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    auth: false,
    body: {
      email,
      role,
    },
  });
}

export async function resetPassword({ code, password, confirmPassword }) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    auth: false,
    body: {
      code,
      password,
      confirmPassword,
    },
  });
}
