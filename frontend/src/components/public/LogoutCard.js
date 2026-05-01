"use client";

import Link from "next/link";
import { useEffect } from "react";
import styles from "@/components/public/PublicPage.module.css";
import { useAuth } from "@/components/auth/AuthProvider";

export function LogoutCard() {
  const auth = useAuth();

  useEffect(() => {
    auth.logout();
  }, [auth]);

  return (
    <div className={styles.logoutWrap}>
      <section className={styles.logoutCard}>
        <span className={styles.eyebrow}>Session</span>
        <h1>Sign out</h1>
        <p>
          End your current session and return to the public area of AuctionArc.
        </p>
        <div className={styles.buttonRow}>
          <Link href="/login" className={styles.submitButton}>
            Return to login
          </Link>
          <Link href="/" className={styles.secondaryButton}>
            Back to homepage
          </Link>
        </div>
      </section>
    </div>
  );
}
