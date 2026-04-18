"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/components/public/PublicPage.module.css";
import {
  clearStoredToken,
  fetchCurrentUser,
  getStoredToken,
} from "@/lib/auth";

function destinationForRole(role) {
  if (role === "Seller") {
    return "/seller";
  }

  if (role === "Bidder") {
    return "/bidder";
  }

  if (role === "Admin") {
    return "/admin";
  }

  return "/login";
}

export function ProtectedRoute({ allowedRoles, children }) {
  const router = useRouter();
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("Checking your account access...");

  useEffect(() => {
    let isMounted = true;

    async function verifyAccess() {
      const token = getStoredToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const authData = await fetchCurrentUser(token);
        const userRole = authData?.user?.role;

        if (!userRole) {
          throw new Error("Your session is missing role information.");
        }

        if (!allowedRoles.includes(userRole)) {
          router.replace(destinationForRole(userRole));
          return;
        }

        if (isMounted) {
          setStatus("ready");
        }
      } catch (error) {
        clearStoredToken();

        if (isMounted) {
          setMessage(error.message || "Your session could not be verified. Please sign in again.");
          setStatus("error");
        }

        router.replace("/login");
      }
    }

    verifyAccess();

    return () => {
      isMounted = false;
    };
  }, [allowedRoles, router]);

  if (status !== "ready") {
    return (
      <div className={styles.logoutWrap}>
        <section className={styles.logoutCard}>
          <span className={styles.eyebrow}>Access Check</span>
          <h1>Please wait</h1>
          <p>{message}</p>
        </section>
      </div>
    );
  }

  return children;
}
