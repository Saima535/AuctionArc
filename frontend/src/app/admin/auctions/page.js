"use client";

import {
  DataTable,
  FilterBar,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import styles from "../page.module.css";

const auctionColumns = [
  { key: "id", label: "Auction ID" },
  { key: "title", label: "Auction" },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <StatusBadge tone={value === "Live" ? "good" : value === "Scheduled" ? "neutral" : value === "Extended" ? "warn" : "danger"}>
        {value}
      </StatusBadge>
    ),
  },
  { key: "reserve", label: "Reserve" },
  { key: "countdown", label: "Countdown" },
  { key: "bids", label: "Bids" },
];

export default function AdminAuctionsPage() {
  const { data, error } = useApiData("/admin/auctions", {
    initialData: [],
  });

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Auctions"
        description="Monitor live, scheduled, and interrupted auction sessions across the marketplace."
        action={<FilterBar items={["Live", "Scheduled", "Extended", "Paused", "Under review"]} />}
      />

      {error ? <p>{error}</p> : null}

      <Panel title="Auction operations board" description="Reserve state, countdown state, and intervention controls in one place.">
        <DataTable columns={auctionColumns} rows={data} />
      </Panel>

      <Panel title="Recommended admin actions" description="Common interventions that should be readily accessible here.">
        <div className={styles.compactList}>
          {["Pause auction", "Cancel auction", "Extend auction", "Mark reviewed", "Notify participants"].map((item) => (
            <article key={item} className={styles.compactCard}>
              <strong>{item}</strong>
              <p>Use these actions alongside the live auction table above.</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
