import {
  DataTable,
  FilterBar,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { auctionsData } from "@/data/admin/mock-data";
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
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Auctions"
        description="Monitor live, scheduled, and interrupted auction sessions across the marketplace."
        action={<FilterBar items={["Live", "Scheduled", "Extended", "Paused", "Under review"]} />}
      />

      <Panel title="Auction operations board" description="Reserve state, countdown state, and intervention controls in one place.">
        <DataTable columns={auctionColumns} rows={auctionsData} />
      </Panel>

      <Panel title="Recommended admin actions" description="Common interventions that should be readily accessible here.">
        <div className={styles.compactList}>
          {["Pause auction", "Cancel auction", "Extend auction", "Mark reviewed", "Notify participants"].map((item) => (
            <article key={item} className={styles.compactCard}>
              <strong>{item}</strong>
              <p>Frontend control placeholder ready for backend action wiring.</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
