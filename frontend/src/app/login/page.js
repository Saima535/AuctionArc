import Link from "next/link";
import styles from "@/components/public/PublicPage.module.css";
import { LoginForm } from "@/components/public/LoginForm";

export const metadata = {
  title: "Login | AuctionArc",
  description: "Sign in to AuctionArc as a seller or bidder.",
};

export default function LoginPage() {
  return (
    <div className={styles.authWrap}>
      <section className={styles.authCard}>
        <span className={styles.eyebrow}>Welcome back</span>
        <h1>Sign In</h1>
        <p>
          Access your AuctionArc workspace to bid, manage listings, and stay on
          top of every live auction.
        </p>
        <ul className={styles.bulletList}>
          <li>Buyer access opens the bidding workspace.</li>
          <li>Seller access opens listing and auction management tools.</li>
          <li>Admin access stays separate from this public sign-in flow.</li>
        </ul>
        <div className={styles.buttonRow}>
          <Link href="/admin-login" className={styles.secondaryButton}>
            Admin Login
          </Link>
        </div>
      </section>

      <section className={styles.authCard}>
        <LoginForm />
      </section>
    </div>
  );
}
