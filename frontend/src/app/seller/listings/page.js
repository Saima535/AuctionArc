"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import shared from "@/components/seller/SellerShared.module.css";
import { useApiData } from "@/hooks/useApiData";
import { ListingImageGallery } from "@/components/listing/ListingImageGallery";
import { apiRequest } from "@/lib/api";
import {
  EditIcon,
  PlusIcon,
  TrashIcon,
  PauseIcon,
} from "@/components/seller/SellerIcons";

const defaultForm = {
  // Edit state mirrors the subset of listing fields this page allows the seller to change.
  title: "",
  category: "",
  description: "",
  price: "",
  buyNowPrice: "",
  condition: "Good",
  auctionDurationDays: "5",
  auctionDurationUnit: "day",
};
const durationUnitOptions = ["minute", "day"];

// Dashboard/API values are formatted currency strings, so editing needs a
// helper that strips presentation characters back to raw numeric text.
function toPlainAmount(value) {
  return String(value || "").replace(/[$,]/g, "");
}

// Listing cards use a human-friendly date/time summary for scheduled auction state.
function formatDateTime(value) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

// Time-left formatting keeps seller cards readable without exposing raw timestamps.
function formatTimeLeft(value) {
  if (!value) {
    return "Waiting for schedule";
  }

  const endDate = new Date(value);

  if (Number.isNaN(endDate.getTime())) {
    return "Waiting for schedule";
  }

  const diffMs = endDate.getTime() - Date.now();

  if (diffMs <= 0) {
    return "Ended";
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  return `${minutes}m left`;
}

// Duration labels combine the numeric amount with its day/minute unit.
function formatAuctionDurationLabel(value, unit = "day") {
  const amount = Number(value) || 0;
  const normalizedUnit = unit === "minute" ? "minute" : "day";
  const suffix = amount === 1 ? normalizedUnit : `${normalizedUnit}s`;
  return `${amount} ${suffix} auction`;
}

// Status chips keep draft/review/live states visually distinct in the seller UI.
function statusClass(status) {
  return status === "Live" || status === "Featured" || status === "Extended"
    ? shared.badgeActive
    : status === "Pending approval" || status === "Pending review" || status === "Scheduled"
      ? shared.badgePending
      : shared.badgeMuted;
}

export default function SellerListingsPage() {
  const searchParams = useSearchParams();
  // Listing management is driven entirely from the seller dashboard API response.
  const { data, setData, error, isLoading } = useApiData("/dashboard/seller/listings", {
    initialData: [],
  });
  const [editingId, setEditingId] = useState("");
  const [formValues, setFormValues] = useState(defaultForm);
  const [busyId, setBusyId] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const confirmedFeatureSessionRef = useRef("");

  // Memoized rows keep downstream rendering stable while data refreshes.
  const listingCards = useMemo(() => data || [], [data]);

  useEffect(() => {
    // The listing page also acts as the return target for featured-listing
    // Stripe checkouts, so it inspects query params on load.
    const featurePayment = searchParams.get("featurePayment");
    const sessionId = searchParams.get("session_id");
    const listingId = searchParams.get("listing");

    if (!featurePayment) {
      return;
    }

    if (featurePayment === "success" && sessionId) {
      // Guard against duplicate confirmations during React rerenders/navigation updates.
      if (confirmedFeatureSessionRef.current === sessionId) {
        return;
      }

      confirmedFeatureSessionRef.current = sessionId;
      setPageError("");
      setPageMessage("Confirming your featured listing payment...");

      apiRequest("/payments/confirm-session", {
        method: "POST",
        body: { sessionId },
      })
        .then((result) => {
          // Optimistically update the local row so the seller sees the featured
          // state immediately after the payment confirmation completes.
          if (listingId) {
            setData((current) =>
              current.map((row) =>
                String(row.listingId) === String(listingId)
                  ? { ...row, premiumHighlight: true }
                  : row,
              ),
            );
          }

          setPageMessage(result.message || "Featured listing payment confirmed successfully.");
          window.history.replaceState({}, "", "/seller/listings");
        })
        .catch((requestError) => {
          setPageError(requestError.message || "Could not confirm the featured listing payment.");
          window.history.replaceState({}, "", "/seller/listings");
        });

      return;
    }

    if (featurePayment === "cancelled") {
      // Cancellation still preserves the already-created listing.
      setPageError("");
      setPageMessage("Featured payment was cancelled. Your listing is still saved, and you can feature it later for $5.");
      window.history.replaceState({}, "", "/seller/listings");
      return;
    }

    if (featurePayment === "setup-failed") {
      // Checkout setup failure is surfaced as guidance instead of a hard stop.
      setPageError("");
      setPageMessage("Your listing was saved, but Stripe could not open automatically. Use the Feature for $5 button below when you are ready.");
      window.history.replaceState({}, "", "/seller/listings");
    }
  }, [searchParams, setData]);

  function startEditing(row) {
    // Existing listing data is copied into local edit state in plain-text form.
    setEditingId(row.listingId);
    setFormValues({
      title: row.title || "",
      category: row.category || "",
      description: row.description || "",
      price: toPlainAmount(row.currentBid || row.price),
      buyNowPrice: toPlainAmount(row.buyNowPrice),
      condition: row.condition || "Good",
      auctionDurationDays: String(row.auctionDurationDays || 5),
      auctionDurationUnit: row.auctionDurationUnit || "day",
    });
    setPageError("");
    setPageMessage("");
  }

  function stopEditing() {
    // Leaving edit mode resets the side-panel form completely.
    setEditingId("");
    setFormValues(defaultForm);
  }

  async function handleUpdateListing() {
    if (!editingId) {
      return;
    }

    setPageError("");
    setPageMessage("");
    setBusyId(editingId);

    try {
      // Price fields are validated client-side first so the seller gets fast feedback.
      const amount = Number(formValues.price || 0);
      const buyNowAmount = Number(formValues.buyNowPrice || 0);

      if (!buyNowAmount || buyNowAmount <= 0) {
        throw new Error("Buy now price is required.");
      }

      if (buyNowAmount <= amount) {
        throw new Error("Buy now price must be greater than the starting price.");
      }

      const result = await apiRequest(`/auctions/listings/${editingId}`, {
        method: "PATCH",
        body: {
          title: formValues.title,
          category: formValues.category,
          description: formValues.description,
          price: amount,
          buyNowPrice: buyNowAmount,
          condition: formValues.condition,
          auctionDurationDays: Number(formValues.auctionDurationDays || 5),
          auctionDurationUnit: formValues.auctionDurationUnit,
        },
      });

      setData((current) =>
        current.map((row) =>
          row.listingId === editingId
            ? {
                // The updated row is patched locally so the UI reflects the edit
                // without waiting for a full page refetch.
                ...row,
                ...result.data,
                title: formValues.title,
                category: formValues.category,
                description: formValues.description,
                condition: formValues.condition,
                auctionDurationDays: Number(formValues.auctionDurationDays || 5),
                auctionDurationUnit: formValues.auctionDurationUnit,
                price: `$${amount.toLocaleString()}`,
                currentBid: `$${amount.toLocaleString()}`,
                buyNowPrice: `$${buyNowAmount.toLocaleString()}`,
              }
            : row,
        ),
      );
      setPageMessage("Listing updated successfully.");
      stopEditing();
    } catch (requestError) {
      setPageError(requestError.message || "Could not update the listing.");
    } finally {
      setBusyId("");
    }
  }

  async function handleStatusToggle(row) {
    // Seller-side status actions are now limited to approval submission only.
    if (!(row.status === "Draft" || row.status === "Rejected")) {
      return;
    }

    const nextStatus = "Pending approval";
    setPageError("");
    setPageMessage("");
    setBusyId(row.listingId);

    try {
      await apiRequest(`/auctions/listings/${row.listingId}`, {
        method: "PATCH",
        body: { status: nextStatus },
      });

      setData((current) =>
        current.map((item) =>
          item.listingId === row.listingId ? { ...item, status: nextStatus } : item,
        ),
      );
      setPageMessage(`${row.title} submitted for approval.`);
    } catch (requestError) {
      setPageError(requestError.message || "Could not update listing status.");
    } finally {
      setBusyId("");
    }
  }

  async function handleDelete(row) {
    // Deletion removes the row locally after the backend confirms the action.
    setPageError("");
    setPageMessage("");
    setBusyId(row.listingId);

    try {
      await apiRequest(`/auctions/listings/${row.listingId}`, {
        method: "DELETE",
      });

      setData((current) => current.filter((item) => item.listingId !== row.listingId));
      if (editingId === row.listingId) {
        stopEditing();
      }
      setPageMessage(`${row.title} deleted successfully.`);
    } catch (requestError) {
      setPageError(requestError.message || "Could not delete the listing.");
    } finally {
      setBusyId("");
    }
  }

  async function handleFeatureCheckout(row) {
    // Featuring an existing listing is a separate seller-paid Stripe flow.
    setPageError("");
    setPageMessage("");
    setBusyId(row.listingId);

    try {
      const result = await apiRequest("/payments/checkout-session", {
        method: "POST",
        body: {
          purpose: "featured-listing",
          listingId: row.listingId,
        },
      });

      if (!result.data?.url) {
        throw new Error("Stripe checkout could not be opened.");
      }

      window.location.assign(result.data.url);
    } catch (requestError) {
      setPageError(requestError.message || "Could not open the featured listing checkout.");
      setBusyId("");
    }
  }

  return (
    <div className={shared.page}>
      <section className={shared.sectionHeader}>
        <div>
          <h1>Listings Management</h1>
          <p>Review every listed product with its live auction timing, pricing, and bidding activity.</p>
        </div>

        <Link href="/seller/listings/new" className={shared.primaryCta}>
          <PlusIcon />
          <span>Create New Listing</span>
        </Link>
      </section>

      {error ? <p className={shared.errorText}>{error}</p> : null}
      {pageError ? <p className={shared.errorText}>{pageError}</p> : null}
      {pageMessage ? <p className={shared.successText}>{pageMessage}</p> : null}
      {isLoading ? <p className={shared.mutedText}>Loading your listings...</p> : null}

      <section className={shared.listingGrid}>
        {/* Empty state keeps the management page informative before the seller has inventory. */}
        {!listingCards.length ? (
          <article className={`${shared.panel} ${shared.listingCard}`}>
            <div className={shared.listingBody}>
              <h3>No listings found yet</h3>
              <p>Create your first auction product to start tracking bids and auction timing here.</p>
            </div>
          </article>
        ) : null}

        {listingCards.map((row) => {
          // Auction-derived values take precedence when a linked auction exists.
          const activeAuction = row.auction;
          const displayStatus = activeAuction?.status || row.status;
          const displayBid = activeAuction?.currentBid || row.currentBid || row.price;
          const displayBidCount = activeAuction?.bidCount || row.bidCount || "0";
          const timeLeft = formatTimeLeft(activeAuction?.endAt);
          const endTime = formatDateTime(activeAuction?.endAt);
          const startTime = formatDateTime(activeAuction?.startAt);
          const canManageBeforeApproval =
            !activeAuction && !["Live", "Featured"].includes(row.status);

          return (
            <article key={row.listingId} className={`${shared.panel} ${shared.listingCard}`}>
              <div className={shared.listingMedia}>
                <ListingImageGallery
                  images={row.images?.length ? row.images : row.imageUrl ? [row.imageUrl] : []}
                  title={row.title}
                  fallback={row.category?.slice(0, 1) || "L"}
                  fallbackClassName={shared.mediaPlaceholder}
                />

                <div className={shared.listingBadgeRow}>
                  <span className={`${shared.badge} ${statusClass(displayStatus)}`}>{displayStatus}</span>
                  {row.premiumHighlight ? <span className={shared.featureTag}>Featured</span> : null}
                </div>
              </div>

              <div className={shared.listingBody}>
                <div className={shared.listingHeader}>
                  <div>
                    <span className={shared.cardCode}>{row.id}</span>
                    <h3>{row.title}</h3>
                    <p className={shared.listingCategory}>{row.category}</p>
                  </div>
                  <div className={shared.listingHeaderMeta}>
                    <span className={shared.moneyValue}>{displayBid}</span>
                    <small>{displayBidCount} bids</small>
                  </div>
                </div>

                <p className={shared.listingDescription}>
                  {row.description || "No product description has been added for this listing yet."}
                </p>

                <div className={shared.listingStatGrid}>
                  {/* These cards summarize the most actionable timing/performance fields. */}
                  <article className={shared.listingStatCard}>
                    <span>Auction time</span>
                    <strong>{formatAuctionDurationLabel(row.auctionDurationDays, row.auctionDurationUnit)}</strong>
                  </article>
                  <article className={shared.listingStatCard}>
                    <span>Time left</span>
                    <strong>{timeLeft}</strong>
                  </article>
                  <article className={shared.listingStatCard}>
                    <span>End time</span>
                    <strong>{endTime}</strong>
                  </article>
                  <article className={shared.listingStatCard}>
                    <span>Bids</span>
                    <strong>{displayBidCount}</strong>
                  </article>
                </div>

                <div className={shared.listingInfoGrid}>
                  <article className={shared.listingInfoCard}>
                    <span>Condition</span>
                    <strong>{row.condition}</strong>
                  </article>
                  <article className={shared.listingInfoCard}>
                    <span>Delivery</span>
                    <strong>{row.delivery}</strong>
                  </article>
                  <article className={shared.listingInfoCard}>
                    <span>Buy now</span>
                    <strong>{row.buyNowPrice}</strong>
                  </article>
                  <article className={shared.listingInfoCard}>
                    <span>Start time</span>
                    <strong>{startTime}</strong>
                  </article>
                  <article className={shared.listingInfoCard}>
                    <span>Auction status</span>
                    <strong>{displayStatus}</strong>
                  </article>
                </div>

                {row.notes?.length ? (
                  <div className={shared.notesStrip}>
                    {row.notes.slice(0, 2).map((note) => (
                      <p key={note}>{note}</p>
                    ))}
                  </div>
                ) : null}

                <div className={shared.listingFooter}>
                  {/* Action buttons cover featured placement, editing, status flow, and deletion. */}
                  <div className={shared.listingActions}>
                    {canManageBeforeApproval && !row.premiumHighlight ? (
                      <button
                        type="button"
                        className={shared.primaryCta}
                        disabled={busyId === row.listingId}
                        aria-label={`Feature ${row.title} for one dollar`}
                        onClick={() => handleFeatureCheckout(row)}
                      >
                        <span>{busyId === row.listingId ? "Opening..." : "Feature for $5"}</span>
                      </button>
                    ) : null}
                    {canManageBeforeApproval ? (
                      <button
                        type="button"
                        className={shared.darkButton}
                        disabled={busyId === row.listingId}
                        aria-label={`Edit ${row.title}`}
                        onClick={() => startEditing(row)}
                      >
                        <EditIcon />
                        <span>Edit</span>
                      </button>
                    ) : null}
                    {row.status === "Draft" || row.status === "Rejected" ? (
                      <button
                        type="button"
                        className={shared.secondaryCta}
                        disabled={busyId === row.listingId}
                        aria-label={`Submit ${row.title} for approval`}
                        onClick={() => handleStatusToggle(row)}
                      >
                        <PauseIcon />
                        <span>Submit</span>
                      </button>
                    ) : null}
                    {canManageBeforeApproval ? (
                      <button
                        type="button"
                        className={shared.listingDanger}
                        disabled={busyId === row.listingId}
                        aria-label={`Delete ${row.title}`}
                        onClick={() => handleDelete(row)}
                      >
                        <TrashIcon />
                        <span>Delete</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {editingId ? (
        <section className={`${shared.panel} ${shared.formPanel}`}>
          {/* The edit panel reuses a compact subset of listing fields instead of the full create form. */}
          <div className={shared.sectionTop}>
            <h2 className={shared.panelTitle}>Edit Listing</h2>
            <button type="button" className={shared.darkButton} onClick={stopEditing}>
              Cancel
            </button>
          </div>

          <div className={shared.formSection}>
            <label className={shared.fieldLabel} htmlFor="seller-listing-title">Title</label>
            <div className={shared.inputWrap}>
              <input
                id="seller-listing-title"
                value={formValues.title}
                onChange={(event) => setFormValues((current) => ({ ...current, title: event.target.value }))}
              />
            </div>
          </div>

          <div className={shared.fieldGrid}>
            <div className={shared.formSection}>
              <label className={shared.fieldLabel} htmlFor="seller-listing-category">Category</label>
              <div className={shared.inputWrap}>
                <input
                  id="seller-listing-category"
                  value={formValues.category}
                  onChange={(event) => setFormValues((current) => ({ ...current, category: event.target.value }))}
                />
              </div>
            </div>
            <div className={shared.formSection}>
              <label className={shared.fieldLabel} htmlFor="seller-listing-price">Starting Price</label>
              <div className={shared.inputWrap}>
                <input
                  id="seller-listing-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formValues.price}
                  onChange={(event) => setFormValues((current) => ({ ...current, price: event.target.value }))}
                />
              </div>
            </div>
            <div className={shared.formSection}>
              <label className={shared.fieldLabel} htmlFor="seller-listing-buy-now">Buy Now Price</label>
              <div className={shared.inputWrap}>
                <input
                  id="seller-listing-buy-now"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formValues.buyNowPrice}
                  onChange={(event) => setFormValues((current) => ({ ...current, buyNowPrice: event.target.value }))}
                />
              </div>
            </div>
            <div className={shared.formSection}>
              <label className={shared.fieldLabel} htmlFor="seller-listing-duration">Duration</label>
              <div className={shared.inputWrap}>
                <input
                  id="seller-listing-duration"
                  type="number"
                  min="1"
                  max="30"
                  value={formValues.auctionDurationDays}
                  onChange={(event) => setFormValues((current) => ({ ...current, auctionDurationDays: event.target.value }))}
                />
              </div>
              <div className={shared.inputWrap} style={{ marginTop: 10 }}>
                <select
                  value={formValues.auctionDurationUnit}
                  onChange={(event) => setFormValues((current) => ({ ...current, auctionDurationUnit: event.target.value }))}
                >
                  {durationUnitOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit === "minute" ? "Minutes" : "Days"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={shared.formSection}>
            <label className={shared.fieldLabel} htmlFor="seller-listing-condition">Condition</label>
            <div className={shared.inputWrap}>
              <select
                id="seller-listing-condition"
                value={formValues.condition}
                onChange={(event) => setFormValues((current) => ({ ...current, condition: event.target.value }))}
              >
                <option value="Excellent">Excellent</option>
                <option value="Very good">Very good</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>

          <div className={shared.formSection}>
            <label className={shared.fieldLabel} htmlFor="seller-listing-description">Description</label>
            <textarea
              id="seller-listing-description"
              className={shared.textarea}
              value={formValues.description}
              onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))}
            />
          </div>

          <div className={shared.formActions}>
            <button type="button" className={shared.primaryCta} disabled={busyId === editingId} onClick={handleUpdateListing}>
              {busyId === editingId ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
