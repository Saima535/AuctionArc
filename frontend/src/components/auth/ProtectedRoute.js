"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "@/components/public/PublicPage.module.css";
import { useAuth } from "@/components/auth/AuthProvider";

function destinationForRole(role) {
  if (role === "Seller") {
    return "/seller";
  }

  if (role === "Bidder") {
    return "/bidder/discover";
  }

  if (role === "Admin") {
    return "/admin";
  }

  return "/login";
}

function loginRouteForRoles(allowedRoles) {
  if (allowedRoles.length === 1 && allowedRoles[0] === "Admin") {
    return "/admin-login";
  }

  return "/login";
}

export function ProtectedRoute({ allowedRoles, children }) {
  const router = useRouter();
  const auth = useAuth();
  const fallbackLoginRoute = loginRouteForRoles(allowedRoles);
  const hasAllowedRole = auth.role && allowedRoles.includes(auth.role);

  useEffect(() => {
    if (!auth.isReady) {
      return;
    }

    if (!auth.isAuthenticated) {
      router.replace(fallbackLoginRoute);
      return;
    }

    if (!auth.role) {
      router.replace(fallbackLoginRoute);
      return;
    }

    if (!hasAllowedRole) {
      router.replace(destinationForRole(auth.role));
    }
  }, [auth.isAuthenticated, auth.isReady, auth.role, fallbackLoginRoute, hasAllowedRole, router]);

  if (!auth.isReady) {
    return (
      <div className={styles.logoutWrap}>
        <section className={styles.logoutCard}>
          <span className={styles.eyebrow}>Access Check</span>
          <h1>Please wait</h1>
          <p>Checking your account access...</p>
        </section>
      </div>
    );
  }

  if (!auth.isAuthenticated || !hasAllowedRole) {
    return (
      <div className={styles.logoutWrap}>
        <section className={styles.logoutCard}>
          <span className={styles.eyebrow}>Access Check</span>
          <h1>Please wait</h1>
          <p>{auth.error || "Redirecting you to the correct sign-in or workspace..."}</p>
        </section>
      </div>
    );
  }

  return children;
}
