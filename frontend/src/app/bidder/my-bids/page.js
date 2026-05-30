"use client";

import { useCallback, useMemo } from "react";
import {
  DataTable,
  FilterBar,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiErrorNotice } from "@/components/feedback/ApiFeedback";
import { useApiData } from "@/hooks/useApiData";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
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
  const { user } = useAuth();
  const { data, error, refresh } = useApiData("/dashboard/bidder/bids", {
    initialData: [],
    refreshIntervalMs: 10000,
    revalidateOnWindowFocus: true,
  });
  const liveChannels = useMemo(
    () => ["market:bids", user?.id ? `user:${user.id}` : ""],
    [user?.id],
  );
  useLiveRefresh({
    channels: liveChannels,
    enabled: Boolean(user?.id),
    onEvent: useCallback(() => {
      refresh({ background: true });
    }, [refresh]),
  });

  return (
    <div className={styles.page}>
      <SectionIntro
        title="My bids"
        description="Follow your live positions, competition pressure, and bids that require action."
      />

      <FilterBar items={["All bids", "Leading", "Outbid", "Pending check"]} />

      <Panel title="Bid positions" description="Current standing across auctions you are participating in.">
        {error ? <ApiErrorNotice title="Bid positions unavailable" message={error} /> : <DataTable columns={bidColumns} rows={data} />}
      </Panel>
    </div>
  );
}
