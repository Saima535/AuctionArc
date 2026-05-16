"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { apiRequest } from "@/lib/api";
import styles from "@/components/member/MemberDashboard.module.css";

export default function BidderWatchlistPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, setData, error, isRefreshing, lastUpdated, refresh } = useApiData("/dashboard/bidder/watchlist", {
    initialData: [],
    refreshIntervalMs: 15000,
    revalidateOnWindowFocus: true,
  });
  const [activeAuctionId, setActiveAuctionId] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const [nowTick, setNowTick] = useState(() => Date.now());
  const live = useLiveRefresh({
    channels: useMemo(
      () => ["market:auctions", "market:watchlist", user?.id ? `user:${user.id}` : ""],
      [user?.id],
    ),
    enabled: Boolean(user?.id),
    onEvent: useCallback(() => {
      refresh({ background: true });
    }, [refresh]),
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const visibleRows = useMemo(
    () =>
      data.filter((row) => {
        if (!row.endAt) {
          return true;
        }

        return new Date(row.endAt).getTime() > nowTick || row.status === "Sold" || row.status === "Expired";
      }),
    [data, nowTick],
  );

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
      refresh({ background: true });
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
          listingId: row.listingId,
          auctionId: row.auctionId,
          subject: `${row.title} inquiry`,
          body: `Hi, I am following ${row.title} in my watchlist and want to know more before bidding.`,
        },
      });

      refresh({ background: true });
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
        action={
          <LiveRefreshControls
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            lastUpdated={lastUpdated}
            label="Realtime watchlist + 15s fallback"
            connectionState={live.connectionState}
          />
        }
      />

      <FilterBar items={["All watched", "Ending soon", "Live", "Scheduled"]} />

      {pageError ? <p className={styles.errorText}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successText}>{pageMessage}</p> : null}

      <Panel title="Tracked auctions" description="A cleaner view of your watched opportunities and seller context.">
        {error ? <ApiErrorNotice title="Watchlist unavailable" message={error} /> : <DataTable columns={watchlistColumns} rows={visibleRows} />}
      </Panel>
    </div>
  );
}
