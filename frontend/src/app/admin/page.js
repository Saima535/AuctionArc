"use client";

import Link from "next/link";
import styles from "@/components/admin-custom/AdminCustom.module.css";
import { PanelCard, SectionTitle } from "@/components/admin-custom/AdminUi";

function PulseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12h4l2-6 4 12 2-6h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4h8v2.5A4 4 0 0 1 12 10.5 4 4 0 0 1 8 6.5V4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 19h6M12 10.5V19M8 6H5.5A2.5 2.5 0 0 0 8 8.5M16 6h2.5A2.5 2.5 0 0 1 16 8.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 16 6-6 4 4 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7h5v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v18M16 7.5c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.5 2.6 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const summary = [
  { label: "Live Auctions", value: "20", icon: <PulseIcon />, iconClass: styles.greenIcon, cardClass: styles.greenLine },
  { label: "Pending Auctions", value: "21", icon: <ClockIcon />, iconClass: styles.goldIcon, cardClass: styles.yellowLine },
  { label: "Closed Auctions", value: "10", icon: <CheckIcon />, iconClass: styles.blueIcon, cardClass: styles.blueLine },
];

const transactions = [
  { label: "Package Transactions", value: "150", icon: <BoxIcon />, iconClass: styles.purpleIcon, cardClass: styles.purpleLine, fillClass: styles.purpleFill },
  { label: "Bid Transactions", value: "20", icon: <TrendIcon />, iconClass: styles.purpleIcon, cardClass: styles.yellowLine, fillClass: styles.yellowFill },
  { label: "Sold Transactions", value: "25", icon: <DollarIcon />, iconClass: styles.purpleIcon, cardClass: styles.greenLine, fillClass: styles.greenFill },
];

export default function AdminDashboardPage() {
  return (
    <div className={styles.page}>
      <section>
        <SectionTitle>Auction Summary</SectionTitle>
        <div className={styles.summaryGrid}>
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
      </section>

      <section>
        <SectionTitle>User Actions</SectionTitle>
        <Link href="/admin/users" className={styles.primaryAction}>
          <TrophyIcon />
          <span>View Winners</span>
        </Link>
      </section>

      <section>
        <SectionTitle>Transactions Summary</SectionTitle>
        <div className={styles.transactionSummaryGrid}>
          {transactions.map((item) => (
            <PanelCard key={item.label} className={`${styles.transactionCard} ${item.cardClass}`}>
              <div className={styles.transactionTop}>
                <span className={`${styles.transactionIcon} ${item.iconClass}`}>{item.icon}</span>
              </div>
              <div>
                <div className={styles.transactionValueRow}>
                  <strong className={styles.transactionValue}>{item.value}</strong>
                </div>
                <p className={styles.transactionLabel}>{item.label}</p>
              </div>
              <div className={styles.progressTrack}>
                <div className={`${styles.progressFill} ${item.fillClass}`} />
              </div>
            </PanelCard>
          ))}
        </div>
      </section>
    </div>
  );
}
