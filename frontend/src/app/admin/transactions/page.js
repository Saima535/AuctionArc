import {
  DataTable,
  FilterBar,
  Panel,
  SectionIntro,
  StatCard,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { transactionStats, transactionsData } from "@/data/admin/mock-data";
import styles from "../page.module.css";

const transactionColumns = [
  { key: "id", label: "Transaction ID" },
  { key: "user", label: "User" },
  { key: "type", label: "Type" },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <StatusBadge tone={value === "Completed" ? "good" : value === "Pending" || value === "Review" ? "warn" : "neutral"}>
        {value}
      </StatusBadge>
    ),
  },
  { key: "amount", label: "Amount" },
  { key: "channel", label: "Channel" },
];

export default function AdminTransactionsPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Transactions"
        description="Frontend-ready finance control surface for wallets, payouts, refunds, commissions, and settlement monitoring."
        action={<FilterBar items={["All", "Wallet", "Payouts", "Refunds", "Escrow review"]} />}
      />

      <section className={styles.statGrid}>
        {transactionStats.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <Panel title="Transaction monitoring" description="Unified finance activity stream for later backend integration.">
        <DataTable columns={transactionColumns} rows={transactionsData} />
      </Panel>

      <section className={styles.secondaryGrid}>
        <Panel title="Settlement placeholders" description="Areas reserved for deeper backend finance controls.">
          <div className={styles.compactList}>
            {["Escrow release manager", "Commission override review", "Refund approval queue"].map((item) => (
              <article key={item} className={styles.compactCard}>
                <strong>{item}</strong>
                <p>Prepared as a frontend control block for future transactional workflows.</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Payout risk checks" description="Pre-settlement visibility for finance operations.">
          <div className={styles.compactList}>
            {["Pending bank verification", "Manual seller review", "Large payout threshold holds"].map((item) => (
              <article key={item} className={styles.compactCard}>
                <strong>{item}</strong>
                <p>Use this area later for payout rules, exceptions, and reconciliation signals.</p>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
