"use client";

import {
  DataTable,
  FilterBar,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import styles from "@/components/member/MemberDashboard.module.css";

const auctionColumns = [
  { key: "id", label: "Auction ID" },
  { key: "title", label: "Auction" },
  {
    key: "stage",
    label: "Stage",
    render: (value) => (
      <StatusBadge tone={value === "Live" ? "good" : value === "Extended" ? "warn" : "neutral"}>
        {value}
      </StatusBadge>
    ),
  },
  { key: "currentBid", label: "Current bid" },
  { key: "watchers", label: "Watchers" },
  { key: "ends", label: "Ends" },
];

export default function SellerAuctionsPage() {
  const { data, error } = useApiData("/dashboard/seller/auctions", {
    initialData: [],
  });

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Auctions"
        description="Follow live selling sessions, bidder engagement, and end-state timing."
        action={<FilterBar items={["Live", "Extended", "Scheduled", "Completed"]} />}
      />

      <Panel title="Selling activity" description="A focused view of auctions tied to your inventory.">
        {error ? <p>{error}</p> : <DataTable columns={auctionColumns} rows={data} />}
      </Panel>
    </div>
  );
}
