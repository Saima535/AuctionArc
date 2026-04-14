import {
  ActivityFeed,
  Panel,
  SectionIntro,
  StatCard,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import styles from "@/components/member/MemberDashboard.module.css";
import { sellerOverview } from "@/data/member/mock-data";

export default function SellerDashboardPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Seller overview"
        description="Track listing performance, auction activity, buyer demand, and payout visibility from one place."
      />

      <section className={styles.statGrid}>
        {sellerOverview.kpis.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.mainGrid}>
        <Panel title="Recent seller activity" description="Marketplace events that matter to your inventory.">
          <ActivityFeed items={sellerOverview.activity} />
        </Panel>

        <Panel title="Priority messages" description="Questions and support items needing attention.">
          <div className={styles.compactList}>
            {sellerOverview.messages.map((item) => (
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

      <Panel title="Current listings snapshot" description="Quick view of active and pending inventory.">
        <div className={styles.compactList}>
          {sellerOverview.listings.map((listing) => (
            <article key={listing.id} className={styles.compactCard}>
              <div>
                <strong>{listing.title}</strong>
                <p>
                  {listing.price} | {listing.bids} bids
                </p>
              </div>
              <StatusBadge tone={listing.status === "Featured" || listing.status === "Live" ? "good" : "warn"}>
                {listing.status}
              </StatusBadge>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
