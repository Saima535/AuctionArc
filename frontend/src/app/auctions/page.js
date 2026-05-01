import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "Auctions | AuctionArc",
  description: "Explore how AuctionArc structures live auctions, seller control, and secure bidding workflows.",
};

async function getPublicAuctions() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    return [];
  }

  try {
    const response = await fetch(`${apiBaseUrl}/auctions/public`, {
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    return Array.isArray(result.data) ? result.data : [];
  } catch {
    return [];
  }
}

export default async function AuctionsPage() {
  const auctions = await getPublicAuctions();

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

      {!auctions.length ? (
        <section className={styles.emptyState}>
          No public auction products are available right now. Once approved listings are active,
          they will appear here automatically.
        </section>
      ) : (
        <section className={styles.grid}>
          {auctions.map((auction) => (
            <article key={auction.auctionId} className={styles.card}>
              <div
                className={`${styles.media} ${auction.imageUrl ? styles.mediaImage : ""}`.trim()}
                style={auction.imageUrl ? { backgroundImage: `url(${auction.imageUrl})` } : undefined}
              >
                {!auction.imageUrl ? <span className={styles.mediaFallback}>{auction.category?.slice(0, 1) || "A"}</span> : null}
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
      )}
    </div>
  );
}
