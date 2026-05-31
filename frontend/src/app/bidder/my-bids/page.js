"use client";

import { useCallback, useMemo } from "react";
import {
  DataTable,
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
  { key: "product", label: "Product" },
  { key: "auction", label: "Auction" },
  { key: "yourBid", label: "Your bid" },
  { key: "currentBid", label: "Current bid" },
  { key: "stage", label: "Auction stage" },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <StatusBadge tone={value === "Top bid" ? "good" : value === "Outbid" ? "danger" : "warn"}>
        {value}
      </StatusBadge>
    ),
  },
  { key: "placedAt", label: "Placed on" },
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
        description="Review every real bid with the product name, auction code, your bid amount, current live bid, auction stage, and stored bid status."
      />

      <Panel title="Bid history" description="A complete table of your actual bid records across every auction you have joined.">
        {error ? <ApiErrorNotice title="Bid positions unavailable" message={error} /> : <DataTable columns={bidColumns} rows={data} />}
      </Panel>
    </div>
  );
}
