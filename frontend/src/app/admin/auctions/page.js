"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DataTable,
  FilterBar,
  LiveRefreshControls,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { ApiErrorNotice } from "@/components/feedback/ApiFeedback";
import { useApiData } from "@/hooks/useApiData";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { apiRequest } from "@/lib/api";
import styles from "../page.module.css";

function statusTone(value) {
  return value === "Live" ? "good" : value === "Scheduled" || value === "Closed" ? "neutral" : value === "Extended" ? "warn" : "danger";
}

export default function AdminAuctionsPage() {
  const { data, setData, error, isRefreshing, lastUpdated, refresh } = useApiData("/admin/auctions", {
    initialData: [],
    refreshIntervalMs: 10000,
    revalidateOnWindowFocus: true,
  });
  const [selectedAuctionId, setSelectedAuctionId] = useState("");
  const [busyAuctionId, setBusyAuctionId] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const live = useLiveRefresh({
    channels: ["market:auctions", "role:Admin"],
    onEvent: useCallback(() => {
      refresh({ background: true });
    }, [refresh]),
  });

  const selectedAuction =
    data.find((item) => item.auctionId === selectedAuctionId) || data[0];

  const auctionColumns = useMemo(
    () => [
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
      {
        key: "actions",
        label: "Actions",
        render: (_, row) => (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setSelectedAuctionId(row.auctionId)}
          >
            Manage
          </button>
        ),
      },
    ],
    [],
  );

  async function handleAuctionStatus(status) {
    if (!selectedAuction) {
      return;
    }

    setBusyAuctionId(selectedAuction.auctionId);
    setPageError("");
    setPageMessage("");

    try {
      const result = await apiRequest(`/admin/auctions/${selectedAuction.auctionId}/status`, {
        method: "PATCH",
        body: { status },
      });

      setData((current) =>
        current.map((item) => (item.auctionId === selectedAuction.auctionId ? result.data : item)),
      );
      setPageMessage(`${selectedAuction.title} updated to ${status}.`);
      refresh({ background: true });
    } catch (requestError) {
      setPageError(requestError.message || "Could not update auction status.");
    } finally {
      setBusyAuctionId("");
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Auctions"
        description="Monitor live, scheduled, and interrupted auction sessions across the marketplace."
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

      <FilterBar items={["Live", "Scheduled", "Extended", "Paused", "Under review"]} />

      {error ? <ApiErrorNotice title="Admin auction board unavailable" message={error} /> : null}
      {pageError ? <p className={styles.inlineNotice}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successNotice}>{pageMessage}</p> : null}

      <section className={styles.mainGrid}>
        <Panel title="Auction operations board" description="Reserve state, countdown state, and intervention controls in one place.">
          <DataTable columns={auctionColumns} rows={data} />
        </Panel>

        {selectedAuction ? (
          <aside className={styles.detailPanel}>
            <strong>{selectedAuction.title}</strong>
            <p>{selectedAuction.id} | {selectedAuction.status}</p>
            <ul className={styles.noteList}>
              <li>Reserve: {selectedAuction.reserve}</li>
              <li>Countdown: {selectedAuction.countdown}</li>
              <li>{selectedAuction.bids} bids recorded</li>
            </ul>
            <div className={styles.actionRow}>
              {["Live", "Paused", "Extended", "Under review", "Closed"].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={status === "Closed" || status === "Under review" ? styles.dangerButton : styles.actionButton}
                  disabled={busyAuctionId === selectedAuction.auctionId}
                  onClick={() => handleAuctionStatus(status)}
                >
                  {busyAuctionId === selectedAuction.auctionId ? "Updating..." : status}
                </button>
              ))}
            </div>
          </aside>
        ) : null}
      </section>
    </div>
  );
}
