import {
  DataTable,
  FilterBar,
  Panel,
  SectionIntro,
  StatCard,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { bidsData } from "@/data/admin/mock-data";
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
      <StatusBadge tone={value === "Valid" ? "good" : value === "Held" || value === "Review" ? "warn" : "neutral"}>
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
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Bids"
        description="Review bid flow, unusual activity, and escalation paths linked to auction disputes."
        action={<FilterBar items={["All bids", "Valid", "Held", "Review", "Suspicious signals"]} />}
      />

      <section className={styles.statGrid}>
        <StatCard label="Bid approvals" value="91%" delta="+2.2%" tone="good" />
        <StatCard label="Held bids" value="14" delta="+4 today" tone="warn" />
        <StatCard label="Duplicate IP flags" value="6" delta="-1 from yesterday" tone="warn" />
        <StatCard label="Resolved bid disputes" value="23" delta="+5 this week" tone="good" />
      </section>

      <Panel title="Bid review table" description="Signal-heavy table for spotting suspicious patterns quickly.">
        <DataTable columns={bidColumns} rows={bidsData} />
      </Panel>
    </div>
  );
}
