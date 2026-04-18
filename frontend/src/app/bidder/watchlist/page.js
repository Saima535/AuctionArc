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

const watchlistColumns = [
  { key: "id", label: "Watch ID" },
  { key: "title", label: "Auction" },
  { key: "seller", label: "Seller" },
  { key: "currentBid", label: "Current bid" },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <StatusBadge tone={value === "Ending soon" ? "danger" : value === "Live" ? "good" : "neutral"}>
        {value}
      </StatusBadge>
    ),
  },
];

export default function BidderWatchlistPage() {
  const { data, error } = useApiData("/dashboard/bidder/watchlist", {
    initialData: [],
  });

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Watchlist"
        description="Track auctions you care about and monitor urgency before placing or updating bids."
        action={<FilterBar items={["All watched", "Ending soon", "Live", "Scheduled"]} />}
      />

      <Panel title="Tracked auctions" description="A cleaner view of your watched opportunities and seller context.">
        {error ? <p>{error}</p> : <DataTable columns={watchlistColumns} rows={data} />}
      </Panel>
    </div>
  );
}
