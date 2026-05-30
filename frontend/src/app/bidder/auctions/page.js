"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LiveRefreshControls,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiEmptyState, ApiErrorNotice } from "@/components/feedback/ApiFeedback";
import { ListingImageGallery } from "@/components/listing/ListingImageGallery";
import { useApiData } from "@/hooks/useApiData";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { apiRequest } from "@/lib/api";
import styles from "@/components/member/MemberDashboard.module.css";

// Category tone keeps the status badge color aligned with the marketplace theme.
function categoryTone(category) {
  const normalized = String(category || "").toLowerCase();

  if (normalized.includes("vehicle")) {
    return "warn";
  }

  if (normalized.includes("electronic") || normalized.includes("industrial")) {
    return "danger";
  }

  return "good";
}

export default function BidderAuctionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  // Discovery data is refreshed both on a timer and through live marketplace events.
  const { data, setData, error, isRefreshing, lastUpdated, refresh } = useApiData("/dashboard/bidder/discover", {
    initialData: [],
    refreshIntervalMs: 12000,
    revalidateOnWindowFocus: true,
  });
  const [bidValues, setBidValues] = useState({});
  const [pageMessage, setPageMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const [busyAuctionId, setBusyAuctionId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  // A one-second clock tick lets the UI react to auction expiry without waiting for refetch.
  const [nowTick, setNowTick] = useState(() => Date.now());
  const liveChannels = useMemo(
    // Auction cards refresh on auction/bid updates and on any user-specific notifications.
    () => ["market:auctions", "market:bids", user?.id ? `user:${user.id}` : ""],
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

  useEffect(() => {
    // Keep countdown-sensitive availability labels current in the browser.
    const intervalId = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const categories = useMemo(() => {
    // Categories are derived from the live dataset rather than hardcoded.
    const uniqueCategories = Array.from(
      new Set(
        data
          .map((item) => item.category)
          .filter(Boolean),
      ),
    ).sort((left, right) => left.localeCompare(right));

    return ["All", ...uniqueCategories];
  }, [data]);

  const filteredData = useMemo(() => {
    // Expired auctions are hidden from the discover grid immediately on the client.
    const liveData = data.filter((item) => {
      if (!item.endAt) {
        return true;
      }

      return new Date(item.endAt).getTime() > nowTick;
    });

    if (selectedCategory === "All") {
      return liveData;
    }

    return liveData.filter((item) => item.category === selectedCategory);
  }, [data, nowTick, selectedCategory]);

  async function handleBuyNow(item) {
    // Buy now bypasses bidding and creates a Stripe checkout session immediately.
    const busyKey = item.auctionId || item.listingId;

    setPageError("");
    setPageMessage("");

    if (!item.listingId || !item.canBuyNow) {
      setPageError("This product is not available for instant purchase right now.");
      return;
    }

    setBusyAuctionId(busyKey);

    try {
      const result = await apiRequest("/payments/checkout-session", {
        method: "POST",
        body: {
          // The backend uses purpose plus listing/auction ids to create the correct order flow.
          purpose: "buy-now-order",
          listingId: item.listingId,
          auctionId: item.auctionId,
        },
      });

      if (!result.data?.url) {
        throw new Error("The Stripe checkout session could not be started.");
      }

      window.location.assign(result.data.url);
    } catch (requestError) {
      // The button returns to an actionable error state if checkout creation fails.
      setPageError(requestError.message || "Could not start the buy now payment flow.");
      setBusyAuctionId("");
    }
  }

  async function handlePlaceBid(item) {
    // Bidding remains available for open auctions even when buy now is also enabled.
    const bidKey = item.auctionId || item.listingId;
    const amount = Number(bidValues[bidKey]);

    setPageError("");
    setPageMessage("");

    if (!amount || amount <= 0) {
      setPageError("Enter a valid bid amount.");
      return;
    }

    if (!item.auctionId || !item.canBid) {
      setPageError("Bidding is not open for this product yet.");
      return;
    }

    if (item.endAt && new Date(item.endAt).getTime() <= nowTick) {
      setPageError("This auction has already ended.");
      refresh({ background: true });
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
            // Local bid feedback is optimistic; background refresh then syncs the full card state.
            ? { ...row, price: `$${amount.toLocaleString()}`, currentBid: `$${amount.toLocaleString()}` }
            : row,
        ),
      );
      setBidValues((current) => ({ ...current, [bidKey]: "" }));
      setPageMessage(`Bid placed on ${item.title}.`);
      refresh({ background: true });
    } catch (requestError) {
      setPageError(requestError.message || "Could not place bid.");
    } finally {
      setBusyAuctionId("");
    }
  }

  async function handleMessageSeller(item) {
    // Messaging starts or reuses the direct conversation between buyer and seller.
    setPageError("");
    setPageMessage("");
    setBusyAuctionId(item.auctionId || item.listingId);

    try {
      const response = await apiRequest("/conversations", {
        method: "POST",
        body: {
          otherUserId: item.sellerId,
          listingId: item.listingId,
          auctionId: item.auctionId,
        },
      });

      router.push(`/bidder/messages?conversation=${response.data?.id}`);
    } catch (requestError) {
      setPageError(requestError.message || "Could not start the conversation.");
    } finally {
      setBusyAuctionId("");
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Auctions"
        description="Browse listed auction products, filter by category, and join live bidding when a session is open."
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

      <div className={styles.categoryToolbar}>
        {/* Category filtering is client-side because discovery payloads are already compact. */}
        <div className={styles.categoryMenuWrap}>
          <button
            type="button"
            className={styles.categoryToggle}
            onClick={() => setIsCategoryMenuOpen((current) => !current)}
            aria-expanded={isCategoryMenuOpen}
            aria-haspopup="menu"
          >
            Categories
          </button>
          {isCategoryMenuOpen ? (
            <div className={styles.categoryMenu} role="menu" aria-label="Auction categories">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={category === selectedCategory ? styles.categoryItemActive : styles.categoryItem}
                  onClick={() => {
                    setSelectedCategory(category);
                    setIsCategoryMenuOpen(false);
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <p className={styles.categorySummary}>
          {selectedCategory === "All"
            ? "Showing all listed auction products."
            : `Showing ${selectedCategory} products.`}
        </p>
      </div>

      {error ? <ApiErrorNotice title="Auction feed unavailable" message={error} /> : null}
      {pageError ? <p className={styles.errorText}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successText}>{pageMessage}</p> : null}

      {!data.length ? (
        <ApiEmptyState
          title="No auction products available right now"
          message="Once approved auction products are available, they will appear here automatically."
        />
      ) : null}

      {data.length && !filteredData.length ? (
        <ApiEmptyState
          title="No products available in this category"
          message="Try another category or switch back to all products."
        />
      ) : null}

      {filteredData.length ? (
        <section className={styles.auctionGrid}>
          {filteredData.map((item) => {
            // Availability is derived per card so UI states remain accurate while time advances.
            const busyKey = item.auctionId || item.listingId;
            const isExpired = item.endAt ? new Date(item.endAt).getTime() <= nowTick : false;
            const canBidNow = item.canBid && !isExpired;
            const stageLabel = isExpired ? "Closed" : item.stage;

            return (
              <article key={item.listingId || item.id} className={styles.auctionCard}>
                <div className={styles.auctionMedia}>
                  <ListingImageGallery
                    images={item.images?.length ? item.images : item.imageUrl ? [item.imageUrl] : []}
                    title={item.title}
                    fallback={item.category?.slice(0, 1) || "A"}
                    fallbackClassName={styles.auctionMediaFallback}
                  />
                  <div className={styles.auctionBadgeRow}>
                    {item.premiumHighlight ? <span className={styles.featureBadge}>Featured</span> : null}
                    <StatusBadge tone={categoryTone(item.category)}>{item.category}</StatusBadge>
                  </div>
                </div>

                <div className={styles.auctionBody}>
                  <div className={styles.auctionHeader}>
                    <div>
                      <span className={styles.cardCode}>{item.id}</span>
                      <h3>{item.title}</h3>
                    </div>
                    <StatusBadge tone={canBidNow ? "danger" : "good"}>
                      {stageLabel}
                    </StatusBadge>
                  </div>

                  <p className={styles.auctionDescription}>
                    {item.description || "No product description has been added yet."}
                  </p>

                <div className={styles.auctionStatGrid}>
                  {/* Card stats show both the auction path and the instant-purchase path. */}
                  <div className={styles.auctionStatCard}>
                      <span>{item.priceLabel || "Current price"}</span>
                      <strong>{item.currentBid || item.price}</strong>
                    </div>
                    <div className={styles.auctionStatCard}>
                      <span>Buy now</span>
                      <strong>{item.buyNowPrice || "Unavailable"}</strong>
                    </div>
                    <div className={styles.auctionStatCard}>
                      <span>Seller</span>
                      <strong>{item.seller}</strong>
                    </div>
                    <div className={styles.auctionStatCard}>
                      <span>Auction window</span>
                      <strong>{item.auctionWindow}</strong>
                    </div>
                  </div>

                  <div className={styles.auctionInfoGrid}>
                    <p className={styles.auctionMeta}>
                      <span>Condition</span>
                      <strong>{item.condition}</strong>
                    </p>
                    <p className={styles.auctionMeta}>
                      <span>Delivery</span>
                      <strong>{item.delivery}</strong>
                    </p>
                  </div>

                  <div className={styles.inlineForm}>
                    <input
                      className={styles.amountInput}
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder={canBidNow ? "Enter bid amount" : isExpired ? "Auction closed" : "Bidding opens when session goes live"}
                      value={bidValues[busyKey] || ""}
                      onChange={(event) =>
                        setBidValues((current) => ({
                          ...current,
                          [busyKey]: event.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className={styles.actionButton}
                      disabled={busyAuctionId === busyKey || !canBidNow}
                      onClick={() => handlePlaceBid(item)}
                    >
                      {busyAuctionId === busyKey ? "Working..." : canBidNow ? "Place Bid" : isExpired ? "Closed" : "Not Open Yet"}
                    </button>
                  </div>

                  <div className={styles.auctionActionRow}>
                    {/* Buy now and message actions sit alongside bidding so buyers can choose their path. */}
                    <button
                      type="button"
                      className={styles.secondaryAction}
                      disabled={busyAuctionId === busyKey || !item.canBuyNow}
                      onClick={() => handleBuyNow(item)}
                    >
                      {busyAuctionId === busyKey ? "Working..." : item.canBuyNow ? `Buy Now${item.buyNowPrice ? ` ${item.buyNowPrice}` : ""}` : "Buy Now Unavailable"}
                    </button>
                    <button
                      type="button"
                      className={styles.actionButton}
                      disabled={busyAuctionId === busyKey || !item.sellerId}
                      onClick={() => handleMessageSeller(item)}
                    >
                      Message Seller
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}
