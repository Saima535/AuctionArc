"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/components/public/PublicPage.module.css";

export function ForgotPasswordForm() {
  const router = useRouter();

  function handleSubmit(event) {
    event.preventDefault();
    router.push("/login");
  }

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="forgot-email">Email address</label>
        <input id="forgot-email" name="email" type="email" placeholder="Enter your registered email" />
      </div>
      <div className={styles.field}>
        <label htmlFor="forgot-role">Account role</label>
        <select id="forgot-role" name="role" defaultValue="Bidder">
          <option>Seller</option>
          <option>Bidder</option>
        </select>
      </div>
      <div className={styles.buttonRow}>
        <button type="submit" className={styles.submitButton}>
          Send Reset Link
        </button>
        <Link href="/login" className={styles.secondaryButton}>
          Back to login
        </Link>
      </div>
      <p className={styles.helperText}>
        Frontend flow: this currently simulates a reset request and returns the
        user to `/login`. Real email delivery and token validation will come with the backend.
      </p>
    </form>
  );
}
