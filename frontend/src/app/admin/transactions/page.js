"use client";

import styles from "@/components/admin-custom/AdminCustom.module.css";
import { PanelCard, StatusPill } from "@/components/admin-custom/AdminUi";

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

const summary = [
  { value: "$53,650", label: "Total Transaction Value", icon: <DollarIcon />, iconClass: styles.goldIcon, cardClass: styles.yellowLine },
  { value: "4", label: "Completed Transactions", icon: <CheckIcon />, iconClass: styles.greenIcon, cardClass: styles.greenLine },
  { value: "3", label: "In Escrow", icon: <TrendIcon />, iconClass: styles.goldIcon, cardClass: styles.yellowLine },
];

const rows = [
  { id: "#1", item: "Vintage Rolex Watch", amount: "$15,000", status: "Completed", buyer: "John Anderson", seller: "Sarah Mitchell", date: "2024-04-15" },
  { id: "#2", item: "Rare Pokemon Card Collection", amount: "$8,500", status: "Escrow", buyer: "Michael Chen", seller: "Lisa Wang", date: "2024-04-16" },
  { id: "#3", item: "Antique Mahogany Desk", amount: "$3,200", status: "Completed", buyer: "David Thompson", seller: "Emma Rodriguez", date: "2024-04-16" },
  { id: "#4", item: "Limited Edition Speakers", amount: "$950", status: "Escrow", buyer: "Sarah Mitchell", seller: "John Anderson", date: "2024-04-17" },
  { id: "#5", item: "Classic Guitar Collection", amount: "$12,000", status: "Failed", buyer: "Lisa Wang", seller: "Michael Chen", date: "2024-04-17" },
];

export default function AdminTransactionsPage() {
  return (
    <div className={styles.page}>
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
              <th>Item Name</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Buyer</th>
              <th>Seller</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>
                  <div className={styles.listItemWrap}>
                    <span className={styles.listIcon}>
                      <BoxIcon />
                    </span>
                    <span className={styles.itemName}>{row.item}</span>
                  </div>
                </td>
                <td className={styles.moneyText}>{row.amount}</td>
                <td>
                  <StatusPill tone={row.status === "Completed" ? "green" : row.status === "Escrow" ? "gold" : "red"}>
                    {row.status}
                  </StatusPill>
                </td>
                <td>{row.buyer}</td>
                <td>{row.seller}</td>
                <td>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
