"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import shared from "@/components/seller/SellerShared.module.css";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import {
  EditIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  EyeIcon,
  PauseIcon,
} from "@/components/seller/SellerIcons";

const defaultForm = {
  title: "",
  category: "",
  description: "",
  price: "",
  condition: "Good",
  auctionDurationDays: "5",
};

function toPlainAmount(value) {
  return String(value || "").replace(/[$,]/g, "");
}

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

function statusClass(status) {
  return status === "Live" || status === "Featured"
    ? shared.badgeActive
    : status === "Pending approval" || status === "Pending review"
      ? shared.badgePending
      : shared.badgeMuted;
}

export default function SellerListingsPage() {
  const { data, setData, error, isLoading } = useApiData("/dashboard/seller/listings", {
    initialData: [],
  });
  const [editingId, setEditingId] = useState("");
  const [formValues, setFormValues] = useState(defaultForm);
  const [busyId, setBusyId] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  const listingCards = useMemo(() => data || [], [data]);

  function startEditing(row) {
    setEditingId(row.listingId);
    setFormValues({
      title: row.title || "",
      category: row.category || "",
      description: row.description || "",
      price: toPlainAmount(row.currentBid || row.price),
      condition: row.condition || "Good",
      auctionDurationDays: String(row.auctionDurationDays || 5),
    });
    setPageError("");
    setPageMessage("");
  }

  function stopEditing() {
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
      const amount = Number(formValues.price || 0);

      const result = await apiRequest(`/auctions/listings/${editingId}`, {
        method: "PATCH",
        body: {
          title: formValues.title,
          category: formValues.category,
          description: formValues.description,
          price: amount,
          condition: formValues.condition,
          auctionDurationDays: Number(formValues.auctionDurationDays || 5),
        },
      });

      setData((current) =>
        current.map((row) =>
          row.listingId === editingId
            ? {
                ...row,
                ...result.data,
                title: formValues.title,
                category: formValues.category,
                description: formValues.description,
                condition: formValues.condition,
                auctionDurationDays: Number(formValues.auctionDurationDays || 5),
                price: `$${amount.toLocaleString()}`,
                currentBid: `$${amount.toLocaleString()}`,
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
    const nextStatus =
      row.status === "Draft" || row.status === "Rejected" ? "Pending approval" : "Draft";

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
      setPageMessage(
        nextStatus === "Pending approval"
          ? `${row.title} submitted for approval.`
          : `${row.title} moved back to draft.`,
      );
    } catch (requestError) {
      setPageError(requestError.message || "Could not update listing status.");
    } finally {
      setBusyId("");
    }
  }

  async function handleDelete(row) {
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

  return (
    <div className={shared.page}>
      <section className={shared.sectionHeader}>
        <div>
          <h1>Listings Management</h1>
          <p>Review every listed product with its live auction timing, pricing, and buyer engagement.</p>
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
        {!listingCards.length ? (
          <article className={`${shared.panel} ${shared.listingCard}`}>
            <div className={shared.listingBody}>
              <h3>No listings found yet</h3>
              <p>Create your first auction product to start tracking views, watchers, and auction timing here.</p>
            </div>
          </article>
        ) : null}

        {listingCards.map((row) => {
          const activeAuction = row.auction;
          const displayBid = activeAuction?.currentBid || row.currentBid || row.price;
          const displayWatchers = activeAuction?.watcherCount || row.watchers || "0";
          const displayBidCount = activeAuction?.bidCount || row.bidCount || "0";
          const timeLeft = formatTimeLeft(activeAuction?.endAt);
          const endTime = formatDateTime(activeAuction?.endAt);
          const startTime = formatDateTime(activeAuction?.startAt);

          return (
            <article key={row.listingId} className={`${shared.panel} ${shared.listingCard}`}>
              <div
                className={`${shared.listingMedia} ${row.imageUrl ? shared.listingMediaImage : ""}`.trim()}
                style={row.imageUrl ? { backgroundImage: `url(${row.imageUrl})` } : undefined}
              >
                {!row.imageUrl ? (
                  <div className={shared.mediaPlaceholder}>
                    <span>{row.category?.slice(0, 1) || "L"}</span>
                  </div>
                ) : null}

                <div className={shared.listingBadgeRow}>
                  <span className={`${shared.badge} ${statusClass(row.status)}`}>{row.status}</span>
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
                  <article className={shared.listingStatCard}>
                    <span>Auction time</span>
                    <strong>{row.auctionDurationDays} day auction</strong>
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
                    <span>Watchers</span>
                    <strong>{displayWatchers}</strong>
                  </article>
                </div>

                <div className={shared.listingInfoGrid}>
                  <p className={shared.auctionMeta}>
                    <span>Condition</span>
                    <strong>{row.condition}</strong>
                  </p>
                  <p className={shared.auctionMeta}>
                    <span>Delivery</span>
                    <strong>{row.delivery}</strong>
                  </p>
                  <p className={shared.auctionMeta}>
                    <span>Reserve price</span>
                    <strong>{row.reservePrice}</strong>
                  </p>
                  <p className={shared.auctionMeta}>
                    <span>Buy now</span>
                    <strong>{row.buyNowPrice}</strong>
                  </p>
                  <p className={shared.auctionMeta}>
                    <span>Views</span>
                    <strong>{row.views}</strong>
                  </p>
                  <p className={shared.auctionMeta}>
                    <span>Reserve status</span>
                    <strong>{row.reserveStatus}</strong>
                  </p>
                  <p className={shared.auctionMeta}>
                    <span>Start time</span>
                    <strong>{startTime}</strong>
                  </p>
                  <p className={shared.auctionMeta}>
                    <span>Auction status</span>
                    <strong>{activeAuction?.status || "Not scheduled"}</strong>
                  </p>
                </div>

                {row.notes?.length ? (
                  <div className={shared.notesStrip}>
                    {row.notes.slice(0, 2).map((note) => (
                      <p key={note}>{note}</p>
                    ))}
                  </div>
                ) : null}

                <div className={shared.listingFooter}>
                  <div className={shared.listingMetrics}>
                    <span className={shared.tableMetric}>
                      <span className={shared.tableIcon}><EyeIcon /></span>
                      <span>{row.views} views</span>
                    </span>
                    <span className={shared.tableMetric}>
                      <span className={shared.tableIcon}><UsersIcon /></span>
                      <span>{displayWatchers} watchers</span>
                    </span>
                  </div>

                  <div className={shared.listingActions}>
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
                    <button
                      type="button"
                      className={shared.secondaryCta}
                      disabled={busyId === row.listingId}
                      aria-label={`Change status for ${row.title}`}
                      onClick={() => handleStatusToggle(row)}
                    >
                      <PauseIcon />
                      <span>{row.status === "Draft" || row.status === "Rejected" ? "Submit" : "Move to Draft"}</span>
                    </button>
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
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {editingId ? (
        <section className={`${shared.panel} ${shared.formPanel}`}>
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
              <label className={shared.fieldLabel} htmlFor="seller-listing-duration">Duration (days)</label>
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
