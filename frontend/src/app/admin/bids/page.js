"use client";

import { useMemo, useState } from "react";
import {
  DataTable,
  FilterBar,
  Panel,
  SectionIntro,
  StatCard,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "../page.module.css";

function bidStatusTone(value) {
  return value === "Valid" || value === "Top bid" ? "good" : value === "Held" || value === "Review" ? "warn" : "neutral";
}

export default function AdminBidsPage() {
  const { data, setData, error } = useApiData("/admin/bids", {
    initialData: [],
  });
  const [selectedBidId, setSelectedBidId] = useState("");
  const [busyBidId, setBusyBidId] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  const selectedBid = data.find((item) => item.bidId === selectedBidId) || data[0];

  const bidColumns = useMemo(
    () => [
      { key: "id", label: "Bid ID" },
      { key: "auction", label: "Auction" },
      { key: "bidder", label: "Bidder" },
      { key: "amount", label: "Amount" },
      {
        key: "status",
        label: "Status",
        render: (value) => <StatusBadge tone={bidStatusTone(value)}>{value}</StatusBadge>,
      },
      {
        key: "signal",
        label: "Signal",
        render: (value) => (
          <StatusBadge tone={value === "Normal" || value === "High intent" ? "good" : "danger"}>
            {value}
          </StatusBadge>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (_, row) => (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setSelectedBidId(row.bidId)}
          >
            Review
          </button>
        ),
      },
    ],
    [],
  );

  async function handleBidStatus(status) {
    if (!selectedBid) {
      return;
    }

    setBusyBidId(selectedBid.bidId);
    setPageError("");
    setPageMessage("");

    try {
      const result = await apiRequest(`/admin/bids/${selectedBid.bidId}/status`, {
        method: "PATCH",
        body: { status },
      });

      setData((current) =>
        current.map((item) => (item.bidId === selectedBid.bidId ? result.data : item)),
      );
      setPageMessage(`${selectedBid.id} updated to ${status}.`);
    } catch (requestError) {
      setPageError(requestError.message || "Could not update bid status.");
    } finally {
      setBusyBidId("");
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Bids"
        description="Review bid flow, unusual activity, and escalation paths linked to auction disputes."
        action={<FilterBar items={["All bids", "Valid", "Held", "Review", "Suspicious signals"]} />}
      />

      {error ? <p className={styles.inlineNotice}>{error}</p> : null}
      {pageError ? <p className={styles.inlineNotice}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successNotice}>{pageMessage}</p> : null}

      <section className={styles.statGrid}>
        <StatCard label="Bid approvals" value={`${data.length ? Math.round((data.filter((item) => item.status === "Valid" || item.status === "Top bid").length / data.length) * 100) : 0}%`} delta="Live moderation" tone="good" />
        <StatCard label="Held bids" value={String(data.filter((item) => item.status === "Held").length)} delta="Requires review" tone="warn" />
        <StatCard label="Review flags" value={String(data.filter((item) => item.status === "Review").length)} delta="Manual checks" tone="warn" />
        <StatCard label="Resolved flow" value={String(data.filter((item) => item.status === "Valid" || item.status === "Top bid").length)} delta="Clean bids" tone="good" />
      </section>

      <section className={styles.mainGrid}>
        <Panel title="Bid review table" description="Signal-heavy table for spotting suspicious patterns quickly.">
          <DataTable columns={bidColumns} rows={data} />
        </Panel>

        {selectedBid ? (
          <aside className={styles.detailPanel}>
            <strong>{selectedBid.id}</strong>
            <p>{selectedBid.auction} | {selectedBid.bidder}</p>
            <ul className={styles.noteList}>
              <li>Amount: {selectedBid.amount}</li>
              <li>Status: {selectedBid.status}</li>
              <li>Signal: {selectedBid.signal}</li>
            </ul>
            <div className={styles.actionRow}>
              {["Valid", "Held", "Review", "Pending check"].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={status === "Valid" ? styles.actionButton : styles.secondaryButton}
                  disabled={busyBidId === selectedBid.bidId}
                  onClick={() => handleBidStatus(status)}
                >
                  {busyBidId === selectedBid.bidId ? "Updating..." : status}
                </button>
              ))}
            </div>
          </aside>
        ) : null}
      </section>
    </div>
  );
}
