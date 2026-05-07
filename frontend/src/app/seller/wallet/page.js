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

export default function SellerWalletPage() {
  const { data, error } = useApiData("/dashboard/wallet", {
    initialData: { stats: [], transactions: [] },
  });

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Wallet"
        description="Review available earnings, escrow holds, fees, and payout readiness."
      />

      {error ? <p>{error}</p> : null}

      <section className={styles.statGrid}>
        {data.stats.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.secondaryGrid}>
        <Panel title="Recent transactions" description="Latest wallet and payout-related activity.">
          <DataTable columns={transactionColumns} rows={data.transactions} />
        </Panel>

        <Panel title="Wallet summary" description="A cleaner view of the balances and deductions driving seller payouts.">
          <div className={styles.compactList}>
            {[
              {
                title: "Pending payout readiness",
                detail: "Use this view to monitor what is available now versus what is still waiting on release.",
              },
              {
                title: "Platform fee tracking",
                detail: "Keep an eye on deductions alongside completed and in-progress transaction activity.",
              },
              {
                title: "Escrow balance awareness",
                detail: "Held balances stay visible here so seller cash flow is easier to understand.",
              },
            ].map((item) => (
              <article key={item.title} className={styles.compactCard}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
