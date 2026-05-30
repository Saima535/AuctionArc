"use client";

import { useMemo, useState } from "react";
import {
  DataTable,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "../page.module.css";

function toneForStatus(value) {
  return value === "Live" || value === "Extended" ? "good" : value === "Rejected" ? "danger" : value === "Closed" ? "neutral" : "warn";
}

function canModerateListing(status) {
  return ["Pending approval", "Pending review", "Draft"].includes(status);
}

export default function AdminProductsPage() {
  const { data, setData, error } = useApiData("/admin/products", {
    initialData: [],
  });
  const [busyListingId, setBusyListingId] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  const productColumns = useMemo(
    () => [
      { key: "id", label: "Product ID" },
      { key: "title", label: "Listing" },
      { key: "seller", label: "Seller" },
      { key: "category", label: "Category" },
      {
        key: "status",
        label: "Status",
        render: (value) => <StatusBadge tone={toneForStatus(value)}>{value}</StatusBadge>,
      },
      { key: "countdown", label: "Countdown" },
      { key: "price", label: "Current price" },
      { key: "bids", label: "Bids" },
      {
        key: "actions",
        label: "Actions",
        render: (_, row) => (
          <div className={styles.actionRow}>
            {canModerateListing(row.status) ? (
              <>
                <button
                  type="button"
                  className={styles.actionButton}
                  disabled={busyListingId === row.listingId}
                  onClick={() => handleListingStatus(row, "Live")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className={styles.dangerButton}
                  disabled={busyListingId === row.listingId}
                  onClick={() => handleListingStatus(row, "Rejected")}
                >
                  Reject
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.dangerButton}
                disabled={busyListingId === row.listingId}
                onClick={() => handleDeleteProduct(row)}
              >
                Delete
              </button>
            )}
          </div>
        ),
      },
    ],
    [busyListingId],
  );

  async function handleListingStatus(product, status) {
    if (!product) {
      return;
    }

    setBusyListingId(product.listingId);
    setPageError("");
    setPageMessage("");

    try {
      const result = await apiRequest(`/admin/products/${product.listingId}/status`, {
        method: "PATCH",
        body: { status },
      });

      setData((current) =>
        current.map((item) =>
          item.listingId === product.listingId ? { ...item, ...result.data } : item,
        ),
      );
      setPageMessage(`${product.title} updated to ${status}.`);
    } catch (requestError) {
      setPageError(requestError.message || "Could not update the listing status.");
    } finally {
      setBusyListingId("");
    }
  }

  async function handleDeleteProduct(product) {
    if (!product) {
      return;
    }

    setBusyListingId(product.listingId);
    setPageError("");
    setPageMessage("");

    try {
      await apiRequest(`/admin/products/${product.listingId}`, {
        method: "DELETE",
      });

      setData((current) => current.filter((item) => item.listingId !== product.listingId));
      setPageMessage(`${product.title} deleted successfully.`);
    } catch (requestError) {
      setPageError(requestError.message || "Could not delete the product.");
    } finally {
      setBusyListingId("");
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Products and listings"
        description="Review listing quality, seller inventory, category placement, and moderation decisions."
      />

      {error ? <p className={styles.inlineNotice}>{error}</p> : null}
      {pageError ? <p className={styles.inlineNotice}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successNotice}>{pageMessage}</p> : null}

      <Panel title="Listing control center" description="A moderation-first table of seller inventory entering the marketplace.">
        <DataTable columns={productColumns} rows={data} />
      </Panel>
    </div>
  );
}
