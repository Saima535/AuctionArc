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
        <h1>Login to AuctionArc</h1>
        <p>
          Access the public auction experience for listing items or bidding on
          active auctions.
        </p>
        <ul className={styles.bulletList}>
          <li>This login page is for sellers and bidders only.</li>
          <li>Seller login routes to the seller workspace.</li>
          <li>Bidder login routes to the bidder workspace.</li>
        </ul>
      </section>

      <section className={styles.authCard}>
        <LoginForm />
      </section>
    </div>
  );
}
