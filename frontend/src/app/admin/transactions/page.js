"use client";

import styles from "@/components/admin-custom/AdminCustom.module.css";
import { PanelCard, StatusPill } from "@/components/admin-custom/AdminUi";
import { useApiData } from "@/hooks/useApiData";

function DollarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v18M16 7.5c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.5 2.6 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8.6 12.2 2.2 2.2 4.6-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 16 6-6 4 4 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7h5v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 7 4v10l-7 4-7-4V7l7-4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m5 7 7 4 7-4M12 11v10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function parseCurrency(value) {
  return Number(String(value || "0").replace(/[^0-9.-]/g, "")) || 0;
}

export default function AdminTransactionsPage() {
  const { data, error } = useApiData("/admin/transactions", {
    initialData: [],
  });

  const totalValue = data.reduce((sum, item) => sum + parseCurrency(item.amount), 0);
  const completedCount = data.filter((item) => /success|complete|paid/i.test(item.status)).length;
  const inReviewCount = data.filter((item) => /escrow|pending|hold/i.test(item.status)).length;

  const summary = [
    { value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(totalValue), label: "Total Transaction Value", icon: <DollarIcon />, iconClass: styles.goldIcon, cardClass: styles.yellowLine },
    { value: String(completedCount), label: "Completed Transactions", icon: <CheckIcon />, iconClass: styles.greenIcon, cardClass: styles.greenLine },
    { value: String(inReviewCount), label: "In Review / Escrow", icon: <TrendIcon />, iconClass: styles.goldIcon, cardClass: styles.yellowLine },
  ];

  return (
    <div className={styles.page}>
      {error ? <p className={styles.inlineNotice}>{error}</p> : null}

      <div className={styles.transactionSummaryGrid}>
        {summary.map((item) => (
          <PanelCard key={item.label} className={`${styles.summaryCard} ${item.cardClass}`}>
            <div className={styles.summaryTop}>
              <span className={`${styles.summaryIcon} ${item.iconClass}`}>{item.icon}</span>
              <strong className={styles.summaryValue}>{item.value}</strong>
            </div>
            <p className={styles.summaryLabel}>{item.label}</p>
          </PanelCard>
        ))}
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
            </tr>
          </thead>
          <tbody>
            {!data.length ? (
              <tr>
                <td colSpan={7}>No transactions found.</td>
              </tr>
            ) : null}
            {data.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>
                  <div className={styles.listItemWrap}>
                    <span className={styles.listIcon}>
                      <BoxIcon />
                    </span>
                    <span className={styles.itemName}>{row.user}</span>
                  </div>
                </td>
                <td>{row.type}</td>
                <td className={styles.moneyText}>{row.amount}</td>
                <td>
                  <StatusPill tone={/success|complete|paid/i.test(row.status) ? "green" : /escrow|pending|hold/i.test(row.status) ? "gold" : "red"}>
                    {row.status}
                  </StatusPill>
                </td>
                <td>{row.channel}</td>
                <td>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
