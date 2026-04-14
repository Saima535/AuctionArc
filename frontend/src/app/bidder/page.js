import {
  ActivityFeed,
  Panel,
  SectionIntro,
  StatCard,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import styles from "@/components/member/MemberDashboard.module.css";
import { bidderOverview } from "@/data/member/mock-data";

export default function BidderDashboardPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Bidder overview"
        description="See your active bids, tracked opportunities, wins, and wallet exposure in one place."
      />

      <section className={styles.statGrid}>
        {bidderOverview.kpis.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.mainGrid}>
        <Panel title="Recent activity" description="Important changes affecting your bidding position.">
          <ActivityFeed items={bidderOverview.activity} />
        </Panel>

        <Panel title="Priority messages" description="Seller and support conversations needing attention.">
          <div className={styles.compactList}>
            {bidderOverview.messages.map((item) => (
              <article key={item.title} className={styles.compactCard}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.meta}</p>
                </div>
                <StatusBadge tone="warn">Open</StatusBadge>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <Panel title="Watchlist snapshot" description="Fast view of the most important tracked auctions.">
        <div className={styles.compactList}>
          {bidderOverview.watchlist.map((item) => (
            <article key={item.id} className={styles.compactCard}>
              <div>
                <strong>{item.title}</strong>
                <p>
                  {item.currentBid} | {item.seller}
                </p>
              </div>
              <StatusBadge tone={item.status === "Ending soon" ? "danger" : item.status === "Live" ? "good" : "neutral"}>
                {item.status}
              </StatusBadge>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
