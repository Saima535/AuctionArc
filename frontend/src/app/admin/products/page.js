"use client";

import { useMemo, useState } from "react";
import {
  DataTable,
  FilterBar,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "../page.module.css";

function toneForStatus(value) {
  return value === "Live" || value === "Featured" ? "good" : value === "Rejected" ? "danger" : "warn";
}

export default function AdminProductsPage() {
  const { data, setData, error } = useApiData("/admin/products", {
    initialData: [],
  });
  const [selectedListingId, setSelectedListingId] = useState("");
  const [busyListingId, setBusyListingId] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  const selectedProduct =
    data.find((item) => item.listingId === selectedListingId) || data[0];

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
      { key: "price", label: "Current price" },
      { key: "bids", label: "Bids" },
      {
        key: "actions",
        label: "Actions",
        render: (_, row) => (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setSelectedListingId(row.listingId)}
          >
            Inspect
          </button>
        ),
      },
    ],
    [],
  );

  async function handleListingStatus(status) {
    if (!selectedProduct) {
      return;
    }

    setBusyListingId(selectedProduct.listingId);
    setPageError("");
    setPageMessage("");

    try {
      const result = await apiRequest(`/admin/products/${selectedProduct.listingId}/status`, {
        method: "PATCH",
        body: { status },
      });

      setData((current) =>
        current.map((item) =>
          item.listingId === selectedProduct.listingId ? { ...item, ...result.data } : item,
        ),
      );
      setPageMessage(`${selectedProduct.title} updated to ${status}.`);
    } catch (requestError) {
      setPageError(requestError.message || "Could not update the listing status.");
    } finally {
      setBusyListingId("");
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Products and listings"
        description="Review listing quality, seller inventory, category placement, and moderation decisions."
        action={<FilterBar items={["Pending approval", "Live", "Featured", "Rejected", "Archived"]} />}
      />

      {error ? <p className={styles.inlineNotice}>{error}</p> : null}
      {pageError ? <p className={styles.inlineNotice}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successNotice}>{pageMessage}</p> : null}

      <section className={styles.mainGrid}>
        <Panel title="Listing control center" description="A moderation-first view of inventory entering the marketplace.">
          <DataTable columns={productColumns} rows={data} />
        </Panel>

        {selectedProduct ? (
          <aside className={styles.detailPanel}>
            <strong>{selectedProduct.title}</strong>
            <p>{selectedProduct.seller} | {selectedProduct.status}</p>
            <ul className={styles.noteList}>
              <li>{selectedProduct.category} listing</li>
              <li>{selectedProduct.price} current price</li>
              <li>{selectedProduct.bids} bids recorded</li>
            </ul>
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.actionButton}
                disabled={busyListingId === selectedProduct.listingId}
                onClick={() => handleListingStatus("Live")}
              >
                Approve
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={busyListingId === selectedProduct.listingId}
                onClick={() => handleListingStatus("Featured")}
              >
                Feature
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                disabled={busyListingId === selectedProduct.listingId}
                onClick={() => handleListingStatus("Rejected")}
              >
                Reject
              </button>
            </div>
          </aside>
        ) : null}
      </section>
    </div>
  );
}
