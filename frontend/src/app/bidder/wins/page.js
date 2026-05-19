"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  DataTable,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "@/components/member/MemberDashboard.module.css";

export default function BidderWinsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, error, refresh } = useApiData("/dashboard/bidder/wins", {
    initialData: [],
  });
  const [activeWinId, setActiveWinId] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const confirmAttemptedRef = useRef(false);

  useEffect(() => {
    const paymentStatus = searchParams.get("status");
    const sessionId = searchParams.get("session_id");

    if (paymentStatus !== "success" || !sessionId || confirmAttemptedRef.current) {
      return;
    }

    confirmAttemptedRef.current = true;
    setPageError("");
    setPageMessage("Confirming your Stripe payment...");

    async function confirmPayment() {
      try {
        const result = await apiRequest("/payments/confirm-session", {
          method: "POST",
          body: { sessionId },
        });

        setPageMessage(result.message || "Winning order payment confirmed.");
        refresh({ background: true });
      } catch (requestError) {
        setPageError(requestError.message || "The payment was completed but confirmation failed.");
        setPageMessage("");
      }
    }

    confirmPayment();
  }, [refresh, searchParams]);

  async function handleMessageSeller(row) {
    setPageError("");
    setPageMessage("");
    setActiveWinId(row.id);

    try {
      const response = await apiRequest("/conversations", {
        method: "POST",
        body: {
          otherUserId: row.sellerId,
          listingId: row.listingId,
          auctionId: row.auctionId,
        },
      });

      router.push(`/bidder/messages?conversation=${response.data?.id}`);
    } catch (requestError) {
      setPageError(requestError.message || "Could not start the conversation.");
    } finally {
      setActiveWinId("");
    }
  }

  async function handlePayNow(row) {
    setPageError("");
    setPageMessage("");
    setActiveWinId(row.id);

    try {
      const result = await apiRequest("/payments/checkout-session", {
        method: "POST",
        body: {
          purpose: "winner-order",
          orderId: row.orderId,
        },
      });

      if (result.data?.url) {
        window.location.href = result.data.url;
        return;
      }

      setPageError("The Stripe checkout session could not be started.");
    } catch (requestError) {
      setPageError(requestError.message || "Could not start the payment flow.");
    } finally {
      setActiveWinId("");
    }
  }

  const winColumns = [
  { key: "id", label: "Win ID" },
  { key: "item", label: "Item" },
  { key: "seller", label: "Seller" },
  { key: "amount", label: "Amount" },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <StatusBadge tone={value === "Completed" || value === "Delivered" || value === "Paid" ? "good" : value === "Payment pending" ? "warn" : "neutral"}>
        {value}
      </StatusBadge>
    ),
  },
  {
    key: "actions",
    label: "Actions",
    render: (_, row) => (
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {row.canPay ? (
          <button
            type="button"
            className={styles.actionButton}
            disabled={activeWinId === row.id}
            onClick={() => handlePayNow(row)}
          >
            {activeWinId === row.id ? "Redirecting..." : "Pay Now"}
          </button>
        ) : null}
        <button
          type="button"
          className={styles.secondaryAction}
          disabled={activeWinId === row.id || !row.sellerId}
          onClick={() => handleMessageSeller(row)}
        >
          Message Seller
        </button>
      </div>
    ),
  },
];

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Wins"
        description="Review auctions you have won, payment status, and fulfillment progress."
      />

      {pageError ? <p className={styles.errorText}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successText}>{pageMessage}</p> : null}
      {searchParams.get("status") === "cancelled" ? <p className={styles.inlineNotice}>Stripe checkout was cancelled before payment completed.</p> : null}

      <Panel title="Won auctions" description="Commercial follow-through after successful bidding.">
        {error ? <p>{error}</p> : <DataTable columns={winColumns} rows={data} />}
      </Panel>
    </div>
  );
}
