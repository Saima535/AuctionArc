"use client";

import {
  DataTable,
  FilterBar,
  Panel,
  SectionIntro,
  StatCard,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import styles from "../page.module.css";

const bidColumns = [
  { key: "id", label: "Bid ID" },
  { key: "auction", label: "Auction" },
  { key: "bidder", label: "Bidder" },
  { key: "amount", label: "Amount" },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <StatusBadge tone={value === "Valid" || value === "Top bid" ? "good" : value === "Held" || value === "Review" ? "warn" : "neutral"}>
        {value}
      </StatusBadge>
    ),
  },
  {
    key: "signal",
    label: "Signal",
    render: (value) => (
      <StatusBadge tone={value === "Normal" || value === "High intent" ? "good" : "danger"}>
        {value}
      </StatusBadge>
    ),
  },
];

export default function AdminBidsPage() {
  const { data, error } = useApiData("/admin/bids", {
    initialData: [],
  });

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Bids"
        description="Review bid flow, unusual activity, and escalation paths linked to auction disputes."
        action={<FilterBar items={["All bids", "Valid", "Held", "Review", "Suspicious signals"]} />}
      />

      {error ? <p>{error}</p> : null}

      <section className={styles.statGrid}>
        <StatCard label="Bid approvals" value={`${data.length ? Math.round((data.filter((item) => item.status === "Valid" || item.status === "Top bid").length / data.length) * 100) : 0}%`} delta="Live moderation" tone="good" />
        <StatCard label="Held bids" value={String(data.filter((item) => item.status === "Held").length)} delta="Requires review" tone="warn" />
        <StatCard label="Review flags" value={String(data.filter((item) => item.status === "Review").length)} delta="Manual checks" tone="warn" />
        <StatCard label="Resolved flow" value={String(data.filter((item) => item.status === "Valid" || item.status === "Top bid").length)} delta="Clean bids" tone="good" />
      </section>

      <Panel title="Bid review table" description="Signal-heavy table for spotting suspicious patterns quickly.">
        <DataTable columns={bidColumns} rows={data} />
      </Panel>
    </div>
  );
}
