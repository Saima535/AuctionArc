"use client";

import {
  DataTable,
  Panel,
  SectionIntro,
  StatCard,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import styles from "@/components/member/MemberDashboard.module.css";

const transactionColumns = [
  { key: "id", label: "Transaction ID" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "amount", label: "Amount" },
  { key: "channel", label: "Channel" },
];

export default function BidderWalletPage() {
  const { data, error } = useApiData("/dashboard/wallet", {
    initialData: { stats: [], transactions: [] },
  });

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Wallet"
        description="Monitor available balance, bid holds, refunds, and recent payment activity."
      />

      {error ? <p>{error}</p> : null}

      <section className={styles.statGrid}>
        {data.stats.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.secondaryGrid}>
        <Panel title="Recent transactions" description="Latest wallet, hold, and payment activity.">
          <DataTable columns={transactionColumns} rows={data.transactions} />
        </Panel>

        <Panel title="Payment visibility" description="Key reminders and settlement awareness for active bidders.">
          <div className={styles.compactList}>
            {["Available balance", "Funds on hold", "Refund and payout awareness"].map((item) => (
              <article key={item} className={styles.compactCard}>
                <div>
                  <strong>{item}</strong>
                  <p>The live wallet summary above is now connected to your backend account.</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
