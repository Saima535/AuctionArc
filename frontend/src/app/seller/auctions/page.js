"use client";

import { useCallback, useMemo } from "react";
import {
  DataTable,
  FilterBar,
  LiveRefreshControls,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiErrorNotice } from "@/components/feedback/ApiFeedback";
import { useApiData } from "@/hooks/useApiData";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
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
  const { user } = useAuth();
  const { data, error, isRefreshing, lastUpdated, refresh } = useApiData("/dashboard/seller/auctions", {
    initialData: [],
    refreshIntervalMs: 12000,
    revalidateOnWindowFocus: true,
  });
  const live = useLiveRefresh({
    channels: useMemo(() => ["market:auctions", user?.id ? `user:${user.id}` : ""], [user?.id]),
    enabled: Boolean(user?.id),
    onEvent: useCallback(() => {
      refresh({ background: true });
    }, [refresh]),
  });

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Auctions"
        description="Follow live selling sessions, buyer engagement, and end-state timing."
        action={
          <LiveRefreshControls
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            lastUpdated={lastUpdated}
            label="Realtime auctions + 12s fallback"
            connectionState={live.connectionState}
          />
        }
      />

      <FilterBar items={["Live", "Extended", "Scheduled", "Completed"]} />

      <Panel title="Selling activity" description="A focused view of auctions tied to your inventory.">
        {error ? <ApiErrorNotice title="Seller auctions unavailable" message={error} /> : <DataTable columns={auctionColumns} rows={data} />}
      </Panel>
    </div>
  );
}
