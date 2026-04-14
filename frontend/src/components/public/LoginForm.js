"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/components/public/PublicPage.module.css";

export function LoginForm() {
  const router = useRouter();

  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const role = formData.get("role");
    const destination = role === "Seller" ? "/seller" : "/bidder";

    router.push(destination);
  }

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="login-role">Login as</label>
        <select id="login-role" name="role" defaultValue="Bidder">
          <option>Seller</option>
          <option>Bidder</option>
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="login-email">Email address</label>
        <input id="login-email" name="email" type="email" placeholder="Enter your email" />
      </div>
      <div className={styles.field}>
        <label htmlFor="login-password">Password</label>
        <input id="login-password" name="password" type="password" placeholder="Enter your password" />
      </div>
      <div className={styles.buttonRow}>
        <button type="submit" className={styles.submitButton}>
          Sign In
        </button>
        <Link href="/register" className={styles.secondaryButton}>
          Create account
        </Link>
      </div>
      <p className={styles.helperText}>
        Frontend flow: sellers are redirected to `/seller` and bidders are
        redirected to `/bidder`. Admins should continue to use `/admin`.
      </p>
    </form>
  );
}
