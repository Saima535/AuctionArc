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

        <Panel title="Fee visibility" description="Platform charges and deductions at a glance.">
          <div className={styles.compactList}>
            {["Pending payout visibility", "Platform fee tracking", "Escrow balance awareness"].map((item) => (
              <article key={item} className={styles.compactCard}>
                <div>
                  <strong>{item}</strong>
                  <p>The live wallet summary above now reflects your real backend balances.</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
