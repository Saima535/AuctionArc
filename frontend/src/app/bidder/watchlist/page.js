"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DataTable,
  FilterBar,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "@/components/member/MemberDashboard.module.css";

export default function BidderWatchlistPage() {
  const router = useRouter();
  const { data, setData, error } = useApiData("/dashboard/bidder/watchlist", {
    initialData: [],
  });
  const [activeAuctionId, setActiveAuctionId] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [pageError, setPageError] = useState("");

  async function handleRemove(row) {
    setPageError("");
    setPageMessage("");
    setActiveAuctionId(row.auctionId);

    try {
      await apiRequest(`/auctions/${row.auctionId}/watchlist`, {
        method: "DELETE",
      });

      setData((current) => current.filter((item) => item.auctionId !== row.auctionId));
      setPageMessage(`${row.title} removed from watchlist.`);
    } catch (requestError) {
      setPageError(requestError.message || "Could not remove the watchlist item.");
    } finally {
      setActiveAuctionId("");
    }
  }

  async function handleMessageSeller(row) {
    setPageError("");
    setPageMessage("");
    setActiveAuctionId(row.auctionId);

    try {
      await apiRequest("/messages", {
        method: "POST",
        body: {
          recipientId: row.sellerId,
          subject: `${row.title} inquiry`,
          body: `Hi, I am following ${row.title} in my watchlist and want to know more before bidding.`,
        },
      });

      router.push("/bidder/messages");
    } catch (requestError) {
      setPageError(requestError.message || "Could not start a conversation with the seller.");
    } finally {
      setActiveAuctionId("");
    }
  }

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
  {
    key: "actions",
    label: "Actions",
    render: (_, row) => (
      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.secondaryAction}
          disabled={activeAuctionId === row.auctionId || !row.sellerId}
          onClick={() => handleMessageSeller(row)}
        >
          Message
        </button>
        <button
          type="button"
          className={styles.dangerAction}
          disabled={activeAuctionId === row.auctionId}
          onClick={() => handleRemove(row)}
        >
          Remove
        </button>
      </div>
    ),
  },
];

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Watchlist"
        description="Track auctions you care about and monitor urgency before placing or updating bids."
        action={<FilterBar items={["All watched", "Ending soon", "Live", "Scheduled"]} />}
      />

      {pageError ? <p className={styles.errorText}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successText}>{pageMessage}</p> : null}

      <Panel title="Tracked auctions" description="A cleaner view of your watched opportunities and seller context.">
        {error ? <p>{error}</p> : <DataTable columns={watchlistColumns} rows={data} />}
      </Panel>
    </div>
  );
}
