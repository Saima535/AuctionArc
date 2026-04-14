import Link from "next/link";
import styles from "@/components/public/PublicPage.module.css";

export const metadata = {
  title: "Login | AuctionArc",
  description: "Sign in to AuctionArc as a seller, bidder, or admin.",
};

export default function LoginPage() {
  return (
    <div className={styles.authWrap}>
      <section className={styles.authCard}>
        <span className={styles.eyebrow}>Welcome back</span>
        <h1>Login to AuctionArc</h1>
        <p>
          Access the auction experience that matches your responsibilities,
          whether you are listing items, bidding live, or managing the system.
        </p>
        <ul className={styles.bulletList}>
          <li>Use a single sign-in entry point for all three actors.</li>
          <li>Role-based dashboards can branch from this route later.</li>
          <li>The current page is ready for backend authentication wiring.</li>
        </ul>
      </section>

      <section className={styles.authCard}>
        <form className={styles.authForm}>
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
            Authentication behavior will be connected after the backend phase
            begins.
          </p>
        </form>
      </section>
    </div>
  );
}
