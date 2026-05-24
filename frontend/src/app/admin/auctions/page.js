"use client";

import { useCallback } from "react";
import {
  DataTable,
  LiveRefreshControls,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { ApiErrorNotice } from "@/components/feedback/ApiFeedback";
import { useApiData } from "@/hooks/useApiData";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import styles from "../page.module.css";

function statusTone(value) {
  return value === "Live" ? "good" : value === "Scheduled" || value === "Closed" ? "neutral" : value === "Extended" ? "warn" : "danger";
}

export default function AdminAuctionsPage() {
  const { data, error, isRefreshing, lastUpdated, refresh } = useApiData("/admin/auctions", {
    initialData: [],
    refreshIntervalMs: 10000,
    revalidateOnWindowFocus: true,
  });
  const live = useLiveRefresh({
    channels: ["market:auctions", "role:Admin"],
    onEvent: useCallback(() => {
      refresh({ background: true });
    }, [refresh]),
  });

  const rows = data;

  const auctionColumns = [
    { key: "id", label: "Auction ID" },
    { key: "title", label: "Auction" },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge tone={statusTone(value)}>{value}</StatusBadge>,
    },
    { key: "reserve", label: "Reserve" },
    { key: "countdown", label: "Countdown" },
    { key: "bids", label: "Bids" },
  ];

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Auctions"
        description="A clean operational table for auction status, reserve state, countdown state, and bid activity."
        action={
          <LiveRefreshControls
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            lastUpdated={lastUpdated}
            label="Realtime admin auctions + 10s fallback"
            connectionState={live.connectionState}
          />
        }
      />

      {error ? <ApiErrorNotice title="Admin auction board unavailable" message={error} /> : null}

      <Panel
        title="Auction operations table"
        description="Auction status is now presented read-only in the table." 
      >
        <DataTable columns={auctionColumns} rows={rows} />
      </Panel>
    </div>
  );
}
