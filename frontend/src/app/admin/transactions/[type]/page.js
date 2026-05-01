"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "@/components/admin-custom/AdminCustom.module.css";
import { PanelCard, StatusPill } from "@/components/admin-custom/AdminUi";
import { useApiData } from "@/hooks/useApiData";

const pageMeta = {
  packages: {
    title: "Package Transactions",
    description: "Registration, package, and platform access transactions.",
    matcher: (row) => /package|registration/i.test(row.type),
  },
  bids: {
    title: "Bid Transactions",
    description: "Wallet debits, bid payments, holds, refunds, and bid-related payment activity.",
    matcher: (row) => /bid|wallet|refund|escrow/i.test(`${row.type} ${row.channel}`),
  },
  sold: {
    title: "Sold Transactions",
    description: "Seller payouts and completed sale payment movement.",
    matcher: (row) => /seller payout|sold|paid|payout/i.test(`${row.type} ${row.status}`),
  },
};

function toneForStatus(status) {
  return /success|complete|paid/i.test(status) ? "green" : /escrow|pending|hold|review/i.test(status) ? "gold" : "red";
}

export default function AdminTransactionTypePage() {
  const params = useParams();
  const type = params.type;
  const meta = pageMeta[type] || pageMeta.packages;
  const { data, error } = useApiData("/admin/transactions", {
    initialData: [],
  });
  const rows = data.filter(meta.matcher);

  return (
    <div className={styles.page}>
      <div>
        <h2>{meta.title}</h2>
        <p className={styles.helperText}>{meta.description}</p>
      </div>

      {error ? <p className={styles.inlineNotice}>{error}</p> : null}

      <div className={styles.transactionSummaryGrid}>
        <PanelCard className={`${styles.summaryCard} ${styles.yellowLine}`}>
          <strong className={styles.summaryValue}>{rows.length}</strong>
          <p className={styles.summaryLabel}>Matching records</p>
        </PanelCard>
        <PanelCard className={`${styles.summaryCard} ${styles.greenLine}`}>
          <strong className={styles.summaryValue}>{rows.filter((row) => /success|complete|paid/i.test(row.status)).length}</strong>
          <p className={styles.summaryLabel}>Completed</p>
        </PanelCard>
        <PanelCard className={`${styles.summaryCard} ${styles.purpleLine}`}>
          <strong className={styles.summaryValue}>{rows.filter((row) => /pending|review|escrow|hold/i.test(row.status)).length}</strong>
          <p className={styles.summaryLabel}>Needs attention</p>
        </PanelCard>
      </div>

      <section className={styles.statsTableWrap}>
        <table className={styles.statsTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Channel</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length ? (
              <tr>
                <td colSpan={8}>No transactions match this category.</td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.user}</td>
                <td>{row.type}</td>
                <td className={styles.moneyText}>{row.amount}</td>
                <td><StatusPill tone={toneForStatus(row.status)}>{row.status}</StatusPill></td>
                <td>{row.channel}</td>
                <td>{row.date}</td>
                <td><Link href="/admin/transactions" className={styles.detailsButton}>Open ledger</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
