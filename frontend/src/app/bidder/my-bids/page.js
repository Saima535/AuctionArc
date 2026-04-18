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

const bidColumns = [
  { key: "id", label: "Bid ID" },
  { key: "auction", label: "Auction" },
  { key: "yourBid", label: "Your bid" },
  { key: "standing", label: "Standing" },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <StatusBadge tone={value === "Top bid" ? "good" : value === "Outbid" ? "danger" : "warn"}>
        {value}
      </StatusBadge>
    ),
  },
];

export default function BidderMyBidsPage() {
  const { data, error } = useApiData("/dashboard/bidder/bids", {
    initialData: [],
  });

  return (
    <div className={styles.page}>
      <SectionIntro
        title="My bids"
        description="Follow your live positions, competition pressure, and bids that require action."
        action={<FilterBar items={["All bids", "Leading", "Outbid", "Pending check"]} />}
      />

      <Panel title="Bid positions" description="Current standing across auctions you are participating in.">
        {error ? <p>{error}</p> : <DataTable columns={bidColumns} rows={data} />}
      </Panel>
    </div>
  );
}
