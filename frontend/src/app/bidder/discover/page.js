"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FilterBar,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "@/components/member/MemberDashboard.module.css";

export default function BidderDiscoverPage() {
  const router = useRouter();
  const { data, setData, error } = useApiData("/dashboard/bidder/discover", {
    initialData: [],
  });
  const [bidValues, setBidValues] = useState({});
  const [pageMessage, setPageMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const [busyAuctionId, setBusyAuctionId] = useState("");

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
        action={<FilterBar items={["All", "Vehicles", "Collectibles", "Industrial", "Trending"]} />}
      />

      {error ? <p className={styles.inlineNotice}>{error}</p> : null}
      {pageError ? <p className={styles.errorText}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successText}>{pageMessage}</p> : null}

      <div className={styles.compactList}>
        {!data.length ? <p className={styles.emptyState}>No auctions are available to discover right now.</p> : null}
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
