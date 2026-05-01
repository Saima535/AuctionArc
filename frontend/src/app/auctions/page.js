import Link from "next/link";
import styles from "./page.module.css";
import { PublicAuctionGrid } from "@/components/public/PublicAuctionGrid";
import { fetchPublicAuctions } from "@/lib/public-auctions";

export const metadata = {
  title: "Auctions | AuctionArc",
  description: "Explore how AuctionArc structures live auctions, seller control, and secure bidding workflows.",
};

export default async function AuctionsPage() {
  const auctions = await fetchPublicAuctions();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Public Catalogue</span>
        <h1>Browse live auction products before you join.</h1>
        <p>
          Visitors can explore listed auction products and see what is active in the
          marketplace. To place bids, follow sellers, or join the auction flow, they
          need an AuctionArc account.
        </p>
        <div className={styles.ctaRow}>
          <Link href="/register" className={styles.primaryAction}>
            Create Account to Bid
          </Link>
          <Link href="/login" className={styles.secondaryAction}>
            Sign In
          </Link>
        </div>
      </section>

      <PublicAuctionGrid
        auctions={auctions}
        emptyMessage="No public auction products are available right now. Once approved listings are active, they will appear here automatically."
      />
    </div>
  );
}
