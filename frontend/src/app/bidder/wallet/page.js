import {
  Panel,
  SectionIntro,
  StatCard,
} from "@/components/admin/AdminPrimitives";
import styles from "@/components/member/MemberDashboard.module.css";
import { bidderWallet } from "@/data/member/mock-data";

export default function BidderWalletPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Wallet"
        description="Monitor available balance, bid holds, refunds, and recent payment activity."
      />

      <section className={styles.statGrid}>
        {bidderWallet.stats.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.secondaryGrid}>
        <Panel title="Funding actions" description="Primary money movement tasks prepared for backend wiring.">
          <div className={styles.compactList}>
            {["Add funds to wallet", "Review held balances", "Track refund progress"].map((item) => (
              <article key={item} className={styles.compactCard}>
                <div>
                  <strong>{item}</strong>
                  <p>Frontend-ready action surface for bidder payment controls.</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Payment visibility" description="Key reminders and settlement awareness for active bidders.">
          <div className={styles.compactList}>
            {["Deposit hold on 3 auctions", "Latest payment: $4.2K", "Refund pending: $480"].map((item) => (
              <article key={item} className={styles.compactCard}>
                <div>
                  <strong>{item}</strong>
                  <p>Prepared for wallet and transaction integration in the backend phase.</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
