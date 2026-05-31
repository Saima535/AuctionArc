"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DataTable,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { ApiErrorNotice } from "@/components/feedback/ApiFeedback";
import { useApiData } from "@/hooks/useApiData";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { apiRequest } from "@/lib/api";
import styles from "../page.module.css";

function bidStatusTone(value) {
  return value === "Valid" || value === "Top bid"
    ? "good"
    : value === "Outbid"
      ? "danger"
      : value === "Held" || value === "Review" || value === "Pending check"
        ? "warn"
        : "neutral";
}

export default function AdminBidsPage() {
  const { data, setData, error, refresh } = useApiData("/admin/bids", {
    initialData: [],
    refreshIntervalMs: 8000,
    revalidateOnWindowFocus: true,
  });
  const [busyBidId, setBusyBidId] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  useLiveRefresh({
    channels: ["market:bids", "role:Admin"],
    onEvent: useCallback(() => {
      refresh({ background: true });
    }, [refresh]),
  });

  const bidColumns = useMemo(
    () => [
      { key: "id", label: "Bid ID" },
      { key: "product", label: "Product" },
      { key: "bidder", label: "Buyer" },
      { key: "amount", label: "Amount" },
      {
        key: "status",
        label: "Status",
        render: (value) => <StatusBadge tone={bidStatusTone(value)}>{value}</StatusBadge>,
      },
      {
        key: "actions",
        label: "Actions",
        render: (_, row) => (
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={busyBidId === row.bidId}
            onClick={() => handleDeleteBid(row)}
          >
            {busyBidId === row.bidId ? "Deleting..." : "Delete"}
          </button>
        ),
      },
    ],
    [busyBidId],
  );

  async function handleDeleteBid(row) {
    if (!row?.bidId) {
      return;
    }

    setBusyBidId(row.bidId);
    setPageError("");
    setPageMessage("");

    try {
      await apiRequest(`/admin/bids/${row.bidId}`, {
        method: "DELETE",
      });
      setData((current) => current.filter((item) => item.bidId !== row.bidId));
      setPageMessage(`${row.id} deleted successfully.`);
      await refresh({ background: true });
    } catch (requestError) {
      setPageError(requestError.message || "Could not delete the bid.");
    } finally {
      setBusyBidId("");
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Bids"
        description="Monitor all placed bids in one table with real product, buyer, amount, and status data."
      />

      {error ? <ApiErrorNotice title="Admin bid review unavailable" message={error} /> : null}
      {pageError ? <p className={styles.inlineNotice}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successNotice}>{pageMessage}</p> : null}

      <Panel title="Bids table" description="A clean operational view of placed bids, tied directly to real products and live bid statuses.">
        <DataTable columns={bidColumns} rows={data} />
      </Panel>
    </div>
  );
}
