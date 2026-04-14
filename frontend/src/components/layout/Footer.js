import Link from "next/link";
import styles from "./Footer.module.css";

const roleLinks = ["Seller", "Bidder", "Admin"];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <Link href="/" className={styles.brand}>
            AuctionArc
          </Link>
          <p>
            A focused auction management experience built to support listings,
            bidding activity, and platform oversight in one place.
          </p>
        </div>

        <div className={styles.column}>
          <h2>Audience</h2>
          <ul>
            {roleLinks.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        </div>

        <div className={styles.column}>
          <h2>Sections</h2>
          <ul>
            <li>
              <a href="#features">Features</a>
            </li>
            <li>
              <a href="#roles">Roles</a>
            </li>
            <li>
              <a href="#how-it-works">How It Works</a>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <p>(c) 2026 AuctionArc. Crafted for structured, transparent auctions.</p>
      </div>
    </footer>
  );
}
