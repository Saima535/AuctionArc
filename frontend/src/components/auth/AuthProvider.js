"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AUTH_EVENT_NAME,
  clearStoredToken,
  fetchCurrentUser,
  getStoredToken,
} from "@/lib/auth";

const AuthContext = createContext(null);

function normalizeAuthData(authData, token) {
  return {
    token,
    user: authData?.user || null,
    destination: authData?.destination || null,
  };
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    status: "checking",
    token: null,
    user: null,
    destination: null,
    error: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function syncSession() {
      const token = getStoredToken();

      if (!token) {
        if (isMounted) {
          setAuthState({
            status: "guest",
            token: null,
            user: null,
            destination: null,
            error: "",
          });
        }

        return;
      }

      if (isMounted) {
        setAuthState((current) => ({
          ...current,
          status: "checking",
          token,
          error: "",
        }));
      }

      try {
        const authData = await fetchCurrentUser(token);

        if (!isMounted) {
          return;
        }

        setAuthState({
          status: "authenticated",
          error: "",
          ...normalizeAuthData(authData, token),
        });
      } catch (error) {
        clearStoredToken();

        if (!isMounted) {
          return;
        }

        setAuthState({
          status: "guest",
          token: null,
          user: null,
          destination: null,
          error: error.message || "Your session could not be verified.",
        });
      }
    }

    function handleAuthChange() {
      syncSession();
    }

    syncSession();
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener(AUTH_EVENT_NAME, handleAuthChange);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener(AUTH_EVENT_NAME, handleAuthChange);
    };
  }, []);

  const value = useMemo(
    () => ({
      ...authState,
      isReady: authState.status !== "checking",
      isAuthenticated: authState.status === "authenticated",
      role: authState.user?.role || null,
      logout() {
        clearStoredToken();
      },
      async refresh() {
        const token = getStoredToken();

        if (!token) {
          setAuthState({
            status: "guest",
            token: null,
            user: null,
            destination: null,
            error: "",
          });
          return null;
        }

        setAuthState((current) => ({
          ...current,
          status: "checking",
          token,
          error: "",
        }));

        try {
          const authData = await fetchCurrentUser(token);
          const nextState = {
            status: "authenticated",
            error: "",
            ...normalizeAuthData(authData, token),
          };

          setAuthState(nextState);
          return nextState;
        } catch (error) {
          clearStoredToken();
          setAuthState({
            status: "guest",
            token: null,
            user: null,
            destination: null,
            error: error.message || "Your session could not be verified.",
          });
          return null;
        }
      },
    }),
    [authState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
