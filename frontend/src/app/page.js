import Link from "next/link";
import styles from "./page.module.css";
import { PublicAuctionGrid } from "@/components/public/PublicAuctionGrid";
import { fetchPublicAuctions } from "@/lib/public-auctions";

export default async function Home() {
  const auctions = await fetchPublicAuctions();

  return (
    <div className={styles.page}>
      <section className={styles.hero} id="hero">
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Next-generation auction platform</span>
          <h1>
            Bid Smart.
            <br />
            Win Big.
          </h1>
          <p>
            A black-and-gold marketplace experience built for real-time bidding,
            organized auction management, and secure buyer-seller flow.
          </p>

          <div className={styles.heroActions}>
            <a href="/auctions" className={styles.primaryAction}>
              Explore
            </a>
            <a href="/login" className={styles.secondaryAction}>
              Sign In
            </a>
          </div>
        </div>

        <div className={styles.heroVisualWrap}>
          <div className={styles.heroVisual}>
            <div className={styles.heroGlow} />
            <div className={styles.heroImageCard}>
              <div className={styles.coinCluster}>
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className={styles.gavel} />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="auctions">
        <div className={styles.sectionHeading}>
          <span>Public Auction Products</span>
          <h2>Visitors can browse active auction listings before creating an account.</h2>
        </div>

        <p className={styles.sectionLead}>
          They can explore the products, pricing, seller information, and auction timing here.
          To place bids or join the live auction flow, they need to register as an AuctionArc user.
        </p>

        <PublicAuctionGrid
          auctions={auctions}
          emptyMessage="No public auction products are available on the homepage right now."
        />

        <div className={styles.sectionCtaRow}>
          <Link href="/auctions" className={styles.secondaryAction}>
            View All Auctions
          </Link>
          <Link href="/register" className={styles.primaryAction}>
            Join AuctionArc
          </Link>
        </div>
      </section>
    </div>
  );
}
