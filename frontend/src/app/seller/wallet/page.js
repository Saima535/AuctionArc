import {
  Panel,
  SectionIntro,
  StatCard,
} from "@/components/admin/AdminPrimitives";
import styles from "@/components/member/MemberDashboard.module.css";
import { sellerWallet } from "@/data/member/mock-data";

export default function SellerWalletPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Wallet"
        description="Review available earnings, escrow holds, fees, and payout readiness."
      />

      <section className={styles.statGrid}>
        {sellerWallet.stats.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.secondaryGrid}>
        <Panel title="Payout schedule" description="Upcoming payout cycles and readiness checks.">
          <div className={styles.compactList}>
            {["Next payout run: Friday 10:00 AM", "Bank verification: Complete", "Escrow release pending: 1 order"].map((item) => (
              <article key={item} className={styles.compactCard}>
                <div>
                  <strong>{item}</strong>
                  <p>Frontend-ready summary block for seller settlement visibility.</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Fee visibility" description="Platform charges and deductions at a glance.">
          <div className={styles.compactList}>
            {["Commission rate: 6%", "Current month platform fees: $2.3K", "Refund hold exposure: $480"].map((item) => (
              <article key={item} className={styles.compactCard}>
                <div>
                  <strong>{item}</strong>
                  <p>Prepared for later backend wallet and commission integration.</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
