"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import styles from "@/components/admin-custom/AdminCustom.module.css";
import { PanelCard, StatusPill } from "@/components/admin-custom/AdminUi";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";

function toneForStatus(status) {
  return /live|extended|approved/i.test(status)
    ? "green"
    : /closed|rejected|removed/i.test(status)
      ? "red"
      : "gold";
}

function titleForScope(scope) {
  if (scope === "live") {
    return "Live Auction Details";
  }

  if (scope === "pending") {
    return "Pending Auction Approvals";
  }

  return "Closed Auction Details";
}

export default function AdminAuctionScopePage() {
  const params = useParams();
  const scope = params.scope;
  const { data, setData, error } = useApiData(`/admin/auction-drilldown/${scope}`, {
    initialData: {
      title: titleForScope(scope),
      description: "",
      rows: [],
    },
  });
  const [busyListingId, setBusyListingId] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  const isPending = scope === "pending";

  async function handleListingStatus(row, status) {
    setBusyListingId(row.listingId);
    setPageError("");
    setPageMessage("");

    try {
      const result = await apiRequest(`/admin/products/${row.listingId}/status`, {
        method: "PATCH",
        body: { status },
      });

      setData((current) => ({
        ...current,
        rows: current.rows.map((item) =>
          item.listingId === row.listingId
            ? {
                ...item,
                status: result.data.status,
                price: result.data.price,
                bids: result.data.bids,
              }
            : item,
        ),
      }));
      setPageMessage(`${row.title} updated to ${status}.`);
    } catch (requestError) {
      setPageError(requestError.message || "Could not update product status.");
    } finally {
      setBusyListingId("");
    }
  }

  return (
    <div className={styles.page}>
      <div>
        <h2>{data.title || titleForScope(scope)}</h2>
        <p className={styles.helperText}>{data.description}</p>
      </div>

      {error ? <p className={styles.inlineNotice}>{error}</p> : null}
      {pageError ? <p className={styles.inlineNotice}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successNotice}>{pageMessage}</p> : null}

      <div className={styles.userGrid}>
        {!data.rows.length ? (
          <PanelCard className={styles.userCard}>
            <h3>No records found</h3>
            <p className={styles.helperText}>There are no matching admin records for this view yet.</p>
          </PanelCard>
        ) : null}

        {data.rows.map((row) => (
          <PanelCard key={row.auctionId || row.listingId || row.id} className={styles.userCard}>
            <div className={styles.userHeader}>
              <div className={styles.userInfo}>
                <h3>{row.title}</h3>
                <p className={styles.helperText}>{row.product || row.id}</p>
              </div>
              <StatusPill tone={toneForStatus(row.status)}>{row.status}</StatusPill>
            </div>

            <div className={styles.disputeRows}>
              <span className={styles.labelCell}>Product:</span>
              <span className={styles.valueCell}>{row.product || row.title}</span>
              <span className={styles.labelCell}>Product ID:</span>
              <span className={styles.valueCell}>{row.productCode || row.id}</span>
              <span className={styles.labelCell}>Seller:</span>
              <span className={styles.valueCell}>{row.seller}</span>
              <span className={styles.labelCell}>Seller email:</span>
              <span className={styles.valueCell}>{row.sellerEmail}</span>
              <span className={styles.labelCell}>{isPending ? "List price:" : "Current bid:"}</span>
              <span className={styles.valueCell}>{isPending ? row.price : row.currentBid}</span>
              <span className={styles.labelCell}>Bids:</span>
              <span className={styles.valueCell}>{row.bids}</span>
              <span className={styles.labelCell}>Watchers:</span>
              <span className={styles.valueCell}>{row.watchers}</span>
            </div>

            <div className={styles.userDetails}>
              <strong>Bidder context</strong>
              {!row.topBids?.length ? <p className={styles.helperText}>No bidder activity recorded yet.</p> : null}
              {row.topBids?.map((bid) => (
                <div key={bid.id} className={styles.infoRow}>
                  <span>{bid.bidder}</span>
                  <span>{bid.amount}</span>
                  <StatusPill tone={toneForStatus(bid.status)}>{bid.status}</StatusPill>
                </div>
              ))}
            </div>

            <div className={styles.userActions}>
              {isPending ? (
                <>
                  <button
                    type="button"
                    className={styles.activateButton}
                    disabled={busyListingId === row.listingId}
                    onClick={() => handleListingStatus(row, "Live")}
                  >
                    {busyListingId === row.listingId ? "Updating..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    className={styles.suspendButton}
                    disabled={busyListingId === row.listingId}
                    onClick={() => handleListingStatus(row, "Rejected")}
                  >
                    Reject
                  </button>
                  <Link href="/admin/products" className={styles.detailsButton}>
                    Product center
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/admin/auctions" className={styles.detailsButton}>
                    Manage auction
                  </Link>
                  <Link href="/admin/bids" className={styles.detailsButton}>
                    Review bids
                  </Link>
                </>
              )}
            </div>
          </PanelCard>
        ))}
      </div>
    </div>
  );
}
