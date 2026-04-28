"use client";

import { useState } from "react";
import Link from "next/link";
import shared from "@/components/seller/SellerShared.module.css";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import {
  EditIcon,
  EyeIcon,
  PauseIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
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

export default function SellerListingsPage() {
  const { data, setData, error, isLoading } = useApiData("/dashboard/seller/listings", {
    initialData: [],
  });
  const [editingId, setEditingId] = useState("");
  const [formValues, setFormValues] = useState(defaultForm);
  const [busyId, setBusyId] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

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

      await apiRequest(`/auctions/listings/${editingId}`, {
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
          <p>Create and manage your auction listings</p>
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

      <section className={`${shared.panel} ${shared.tablePanel}`}>
        <div className={shared.tableWrap}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Status</th>
                <th>Current Bid</th>
                <th>Views</th>
                <th>Watchers</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!data.length ? (
                <tr>
                  <td colSpan={6} className={shared.mutedText}>
                    No listings found yet.
                  </td>
                </tr>
              ) : null}

              {data.map((row) => (
                <tr key={row.listingId}>
                  <td>{row.title}</td>
                  <td>
                    <span
                      className={`${shared.badge} ${
                        row.status === "Live" || row.status === "Featured"
                          ? shared.badgeActive
                          : shared.badgePending
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className={shared.accentText}>{row.currentBid || row.price}</td>
                  <td className={shared.mutedText}>
                    <span className={shared.tableMetric}>
                      <span className={shared.tableIcon}><EyeIcon /></span>
                      <span>{row.views || "0"}</span>
                    </span>
                  </td>
                  <td className={shared.mutedText}>
                    <span className={shared.tableMetric}>
                      <span className={shared.tableIcon}><UsersIcon /></span>
                      <span>{row.watchers || "0"}</span>
                    </span>
                  </td>
                  <td>
                    <div className={shared.tableActions}>
                      <button type="button" disabled={busyId === row.listingId} aria-label={`Edit ${row.title}`} onClick={() => startEditing(row)}>
                        <EditIcon />
                      </button>
                      <button type="button" disabled={busyId === row.listingId} aria-label={`Change status for ${row.title}`} onClick={() => handleStatusToggle(row)}>
                        <PauseIcon />
                      </button>
                      <button type="button" disabled={busyId === row.listingId} aria-label={`Delete ${row.title}`} onClick={() => handleDelete(row)}>
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
