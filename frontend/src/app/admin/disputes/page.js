"use client";

import styles from "@/components/admin-custom/AdminCustom.module.css";
import { PanelCard, StatusPill } from "@/components/admin-custom/AdminUi";

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 7 4v10l-7 4-7-4V7l7-4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m5 7 7 4 7-4M12 11v10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 21 19a1.2 1.2 0 0 1-1 1.8H4a1.2 1.2 0 0 1-1-1.8L12 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 9v4.5M12 17.3h.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ResolveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8.8 12.2 2.1 2.1 4.8-5.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const disputes = [
  { title: "Vintage Rolex Watch", id: "#1", reason: "Not delivered", reporter: "John Anderson", against: "Sarah Mitchell", amount: "$15,000", date: "2024-04-16", reasonTone: "red" },
  { title: "Antique Vase", id: "#2", reason: "Damaged", reporter: "Michael Chen", against: "Lisa Wang", amount: "$3,500", date: "2024-04-16", reasonTone: "orange" },
  { title: "Designer Sunglasses", id: "#3", reason: "Wrong item", reporter: "Sarah Mitchell", against: "David Thompson", amount: "$850", date: "2024-04-17", reasonTone: "gold" },
  { title: "Limited Edition Book", id: "#4", reason: "Not delivered", reporter: "Emma Rodriguez", against: "John Anderson", amount: "$650", date: "2024-04-18", reasonTone: "red" },
];

export default function AdminDisputesPage() {
  return (
    <div className={styles.page}>
      <div className={styles.disputesGrid}>
        {disputes.map((item) => (
          <PanelCard key={item.id} className={styles.disputeCard}>
            <div className={styles.disputeHeader}>
              <div className={styles.disputeIdentity}>
                <span className={styles.listIcon}>
                  <BoxIcon />
                </span>
                <div className={styles.disputeInfo}>
                  <h3>{item.title}</h3>
                  <p className={styles.disputeMeta}>Dispute ID: {item.id}</p>
                </div>
              </div>

              <StatusPill tone="red">Active</StatusPill>
            </div>

            <div className={styles.disputeReason}>
              <StatusPill tone={item.reasonTone}>
                <AlertIcon />
                <span style={{ marginLeft: 10 }}>{item.reason}</span>
              </StatusPill>
            </div>

            <div className={styles.disputeRows}>
              <span className={styles.labelCell}>Reported by:</span>
              <span className={styles.valueCell}>{item.reporter}</span>

              <span className={styles.labelCell}>Against:</span>
              <span className={styles.valueCell}>{item.against}</span>

              <span className={styles.labelCell}>Amount:</span>
              <span className={`${styles.valueCell} ${styles.moneyText}`}>{item.amount}</span>

              <span className={styles.labelCell}>Date:</span>
              <span className={styles.valueCell} style={{ fontWeight: 500 }}>{item.date}</span>
            </div>

            <button type="button" className={styles.disputeAction}>
              <ResolveIcon />
              <span>Resolve Dispute</span>
            </button>
          </PanelCard>
        ))}
      </div>
    </div>
  );
}
