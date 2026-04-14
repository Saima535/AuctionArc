"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/components/public/PublicPage.module.css";

export function ResetPasswordForm() {
  const router = useRouter();

  function handleSubmit(event) {
    event.preventDefault();
    router.push("/login");
  }

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="reset-code">Reset code</label>
        <input id="reset-code" name="code" type="text" placeholder="Enter reset code" />
      </div>
      <div className={styles.field}>
        <label htmlFor="reset-password">New password</label>
        <input id="reset-password" name="password" type="password" placeholder="Enter new password" />
      </div>
      <div className={styles.field}>
        <label htmlFor="reset-confirm-password">Confirm new password</label>
        <input
          id="reset-confirm-password"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter new password"
        />
      </div>
      <div className={styles.buttonRow}>
        <button type="submit" className={styles.submitButton}>
          Reset Password
        </button>
        <Link href="/login" className={styles.secondaryButton}>
          Back to login
        </Link>
      </div>
      <p className={styles.helperText}>
        Frontend flow: this simulates password reset completion and returns to `/login`.
      </p>
    </form>
  );
}
