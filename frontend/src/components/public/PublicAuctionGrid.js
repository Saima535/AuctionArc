import Link from "next/link";
import { ListingImageGallery } from "@/components/listing/ListingImageGallery";
import styles from "./PublicAuctionGrid.module.css";

export function PublicAuctionGrid({
  auctions,
  emptyMessage = "No public auction products are available right now.",
  compact = false,
}) {
  if (!auctions.length) {
    return <section className={styles.emptyState}>{emptyMessage}</section>;
  }

  return (
    <section className={styles.grid}>
      {auctions.map((auction) => (
        <article key={auction.listingId || auction.auctionId || auction.id} className={styles.card}>
          <div className={styles.media}>
            <ListingImageGallery
              images={auction.images?.length ? auction.images : auction.imageUrl ? [auction.imageUrl] : []}
              title={auction.title}
              fallback={auction.category?.slice(0, 1) || "A"}
              fallbackClassName={styles.mediaFallback}
            />
            <div className={styles.badgeRow}>
              {auction.premiumHighlight ? <span className={styles.badge}>Featured</span> : null}
              <span className={styles.badgeMuted}>{auction.status}</span>
            </div>
          </div>

          <div className={styles.body}>
            <div className={styles.metaTop}>
              <div>
                <span className={styles.code}>{auction.id}</span>
                <h2>{auction.title}</h2>
              </div>
              <span className={styles.badgeMuted}>{auction.category}</span>
            </div>

            <p className={styles.description}>{auction.description}</p>

            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <span>{auction.priceLabel || "Current bid"}</span>
                <strong>{auction.currentBid}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Seller</span>
                <strong>{auction.seller}</strong>
              </div>
            </div>

            <div className={styles.footer}>
              <p className={styles.note}>
                Condition: {auction.condition} | Delivery: {auction.delivery}
              </p>
              {!compact ? (
                <div className={styles.ctaRow}>
                  <Link href="/register" className={styles.primaryAction}>
                    Join to Participate
                  </Link>
                  <Link href="/login" className={styles.secondaryAction}>
                    Sign In
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
