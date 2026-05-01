"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  FilterBar,
  LiveRefreshControls,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiEmptyState, ApiErrorNotice } from "@/components/feedback/ApiFeedback";
import { useApiData } from "@/hooks/useApiData";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { apiRequest } from "@/lib/api";
import styles from "@/components/member/MemberDashboard.module.css";

export default function BidderDiscoverPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, setData, error, isRefreshing, lastUpdated, refresh } = useApiData("/dashboard/bidder/discover", {
    initialData: [],
    refreshIntervalMs: 12000,
    revalidateOnWindowFocus: true,
  });
  const [bidValues, setBidValues] = useState({});
  const [pageMessage, setPageMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const [busyAuctionId, setBusyAuctionId] = useState("");
  const liveChannels = useMemo(
    () => ["market:auctions", "market:bids", "market:watchlist", user?.id ? `user:${user.id}` : ""],
    [user?.id],
  );
  const handleLiveEvent = useCallback(() => {
    refresh({ background: true });
  }, [refresh]);
  const live = useLiveRefresh({
    channels: liveChannels,
    enabled: Boolean(user?.id),
    onEvent: handleLiveEvent,
  });

  async function handleWatchToggle(item) {
    setPageError("");
    setPageMessage("");
    setBusyAuctionId(item.auctionId);

    try {
      if (item.watchlisted) {
        await apiRequest(`/auctions/${item.auctionId}/watchlist`, {
          method: "DELETE",
        });
      } else {
        await apiRequest(`/auctions/${item.auctionId}/watchlist`, {
          method: "POST",
        });
      }

      setData((current) =>
        current.map((row) =>
          row.auctionId === item.auctionId
            ? { ...row, watchlisted: !row.watchlisted }
            : row,
        ),
      );
      setPageMessage(item.watchlisted ? "Removed from watchlist." : "Added to watchlist.");
      refresh({ background: true });
    } catch (requestError) {
      setPageError(requestError.message || "Could not update watchlist.");
    } finally {
      setBusyAuctionId("");
    }
  }

  async function handlePlaceBid(item) {
    const amount = Number(bidValues[item.auctionId]);

    setPageError("");
    setPageMessage("");

    if (!amount || amount <= 0) {
      setPageError("Enter a valid bid amount.");
      return;
    }

    setBusyAuctionId(item.auctionId);

    try {
      await apiRequest(`/auctions/${item.auctionId}/bids`, {
        method: "POST",
        body: { amount },
      });

      setData((current) =>
        current.map((row) =>
          row.auctionId === item.auctionId
            ? { ...row, price: `$${amount.toLocaleString()}` }
            : row,
        ),
      );
      setBidValues((current) => ({ ...current, [item.auctionId]: "" }));
      setPageMessage(`Bid placed on ${item.title}.`);
      refresh({ background: true });
    } catch (requestError) {
      setPageError(requestError.message || "Could not place bid.");
    } finally {
      setBusyAuctionId("");
    }
  }

  async function handleMessageSeller(item) {
    setPageError("");
    setPageMessage("");
    setBusyAuctionId(item.auctionId);

    try {
      await apiRequest("/messages", {
        method: "POST",
        body: {
          recipientId: item.sellerId,
          subject: `${item.title} inquiry`,
          body: `Hi, I am interested in ${item.title}. Could you share more details about the auction item?`,
        },
      });

      router.push("/bidder/messages");
    } catch (requestError) {
      setPageError(requestError.message || "Could not start the conversation.");
    } finally {
      setBusyAuctionId("");
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Discover"
        description="Browse promising auctions and trending opportunities that match your buying interest."
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

      <FilterBar items={["All", "Vehicles", "Collectibles", "Industrial", "Trending"]} />

      {error ? <ApiErrorNotice title="Discover feed unavailable" message={error} /> : null}
      {pageError ? <p className={styles.errorText}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successText}>{pageMessage}</p> : null}

      <div className={styles.compactList}>
        {!data.length ? (
          <ApiEmptyState
            title="No auctions available right now"
            message="Once new live listings arrive, they will appear here automatically."
          />
        ) : null}
        {data.map((item) => (
          <article key={item.id} className={styles.compactCard}>
            <div className={styles.compactCardBody}>
              <strong>{item.title}</strong>
              <p>
                {item.category} | {item.price} | Seller: {item.seller}
              </p>
              <div className={styles.inlineForm}>
                <input
                  className={styles.amountInput}
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Enter bid amount"
                  value={bidValues[item.auctionId] || ""}
                  onChange={(event) =>
                    setBidValues((current) => ({
                      ...current,
                      [item.auctionId]: event.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  className={styles.actionButton}
                  disabled={busyAuctionId === item.auctionId}
                  onClick={() => handlePlaceBid(item)}
                >
                  {busyAuctionId === item.auctionId ? "Working..." : "Place Bid"}
                </button>
              </div>
            </div>
            <div className={styles.compactActions}>
              <StatusBadge tone={item.interest === "Hot" ? "danger" : item.interest === "High" ? "warn" : "good"}>
                {item.stage}
              </StatusBadge>
              <button
                type="button"
                className={item.watchlisted ? styles.secondaryAction : styles.actionButton}
                disabled={busyAuctionId === item.auctionId}
                onClick={() => handleWatchToggle(item)}
              >
                {item.watchlisted ? "Remove Watch" : "Add Watch"}
              </button>
              <button
                type="button"
                className={styles.secondaryAction}
                disabled={busyAuctionId === item.auctionId || !item.sellerId}
                onClick={() => handleMessageSeller(item)}
              >
                Message Seller
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
