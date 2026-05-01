import Link from "next/link";
import styles from "./PublicAuctionGrid.module.css";

export function PublicAuctionGrid({
  auctions,
  emptyMessage = "No public auction products are available right now.",
}) {
  if (!auctions.length) {
    return <section className={styles.emptyState}>{emptyMessage}</section>;
  }

  return (
    <section className={styles.grid}>
      {auctions.map((auction) => (
        <article key={auction.auctionId} className={styles.card}>
          <div
            className={`${styles.media} ${auction.imageUrl ? styles.mediaImage : ""}`.trim()}
            style={auction.imageUrl ? { backgroundImage: `url(${auction.imageUrl})` } : undefined}
          >
            {!auction.imageUrl ? (
              <span className={styles.mediaFallback}>{auction.category?.slice(0, 1) || "A"}</span>
            ) : null}
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
                <span>Current bid</span>
                <strong>{auction.currentBid}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Countdown</span>
                <strong>{auction.countdown}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Seller</span>
                <strong>{auction.seller}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Watchers</span>
                <strong>{auction.watchers}</strong>
              </div>
            </div>

            <div className={styles.footer}>
              <p className={styles.note}>
                Condition: {auction.condition} | Delivery: {auction.delivery}
              </p>
              <div className={styles.ctaRow}>
                <Link href="/register" className={styles.primaryAction}>
                  Join to Participate
                </Link>
                <Link href="/login" className={styles.secondaryAction}>
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
