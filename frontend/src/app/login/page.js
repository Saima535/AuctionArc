import Link from "next/link";
import styles from "@/components/public/PublicPage.module.css";

export const metadata = {
  title: "Login | AuctionArc",
  description: "Sign in to AuctionArc as a seller or bidder.",
};

export default function LoginPage() {
  return (
    <div className={styles.authWrap}>
      <section className={styles.authCard}>
        <span className={styles.eyebrow}>Welcome back</span>
        <h1>Login to AuctionArc</h1>
        <p>
          Access the public auction experience for listing items or bidding on
          active auctions.
        </p>
        <ul className={styles.bulletList}>
          <li>This login page is for sellers and bidders only.</li>
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
            Admin access is intentionally separated and should not use this
            public login route.
          </p>
        </form>
      </section>
    </div>
  );
}
