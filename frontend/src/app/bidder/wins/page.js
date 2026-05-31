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
  const [feedbackOrderId, setFeedbackOrderId] = useState("");
  const [feedbackRating, setFeedbackRating] = useState("5");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackBusyOrderId, setFeedbackBusyOrderId] = useState("");
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

  async function handleSubmitFeedback(row) {
    setPageError("");
    setPageMessage("");
    setFeedbackBusyOrderId(row.orderId);

    try {
      await apiRequest(`/dashboard/bidder/wins/${row.orderId}/feedback`, {
        method: "POST",
        body: {
          rating: Number(feedbackRating),
          comment: feedbackComment,
        },
      });

      setPageMessage(`Feedback for ${row.item} was sent to the seller.`);
      setFeedbackOrderId("");
      setFeedbackRating("5");
      setFeedbackComment("");
      await refresh({ background: true });
    } catch (requestError) {
      setPageError(requestError.message || "Could not submit seller feedback.");
    } finally {
      setFeedbackBusyOrderId("");
    }
  }

  function renderFeedbackCard(label, feedback) {
    return (
      <div className={styles.feedbackCard}>
        <strong>{label}: {feedback.rating}/5</strong>
        <p>{feedback.comment || "No written feedback."}</p>
      </div>
    );
  }

  const winColumns = [
  { key: "id", label: "Win ID" },
  { key: "item", label: "Item" },
  { key: "seller", label: "Seller" },
  { key: "amount", label: "Amount" },
  { key: "commission", label: "Platform fee" },
  {
    key: "feedback",
    label: "Feedback",
    render: (_, row) => (
      <div className={styles.feedbackStack} style={{ whiteSpace: "normal" }}>
        {row.feedbackLeft ? renderFeedbackCard("You rated seller", row.feedbackLeft) : null}
        {row.feedbackReceived ? renderFeedbackCard("Seller rated you", row.feedbackReceived) : null}
        {!row.feedbackLeft && !row.feedbackReceived ? (
          <span className={styles.feedbackHint}>No feedback has been exchanged for this win yet.</span>
        ) : null}
      </div>
    ),
  },
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
      <div className={styles.feedbackStack} style={{ whiteSpace: "normal" }}>
        <div className={styles.actionRow}>
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
          {row.canLeaveFeedback ? (
            <button
              type="button"
              className={styles.secondaryAction}
              disabled={feedbackBusyOrderId === row.orderId}
              onClick={() => {
                setFeedbackOrderId((current) => current === row.orderId ? "" : row.orderId);
                setFeedbackRating("5");
                setFeedbackComment("");
              }}
            >
              {feedbackOrderId === row.orderId ? "Close feedback" : "Rate seller"}
            </button>
          ) : !row.feedbackLeft ? (
            <span className={styles.feedbackHint}>Feedback opens after delivery.</span>
          ) : null}
        </div>

        {feedbackOrderId === row.orderId ? (
          <div className={styles.inlineForm}>
            <select
              className={styles.selectInput}
              value={feedbackRating}
              onChange={(event) => setFeedbackRating(event.target.value)}
            >
              <option value="5">5 / 5</option>
              <option value="4">4 / 5</option>
              <option value="3">3 / 5</option>
              <option value="2">2 / 5</option>
              <option value="1">1 / 5</option>
            </select>
            <textarea
              className={styles.textareaInput}
              value={feedbackComment}
              onChange={(event) => setFeedbackComment(event.target.value)}
              placeholder="Share optional feedback about the seller."
            />
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.actionButton}
                disabled={feedbackBusyOrderId === row.orderId}
                onClick={() => handleSubmitFeedback(row)}
              >
                {feedbackBusyOrderId === row.orderId ? "Submitting..." : "Submit feedback"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    ),
  },
];

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Wins"
        description="Review won products, payment totals, platform fee, fulfillment progress, and buyer-to-seller feedback after delivery."
      />

      {pageError ? <p className={styles.errorText}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successText}>{pageMessage}</p> : null}
      {searchParams.get("status") === "cancelled" ? <p className={styles.inlineNotice}>Stripe checkout was cancelled before payment completed.</p> : null}

      <Panel title="Won auctions" description="Commercial follow-through after successful bidding and delivery-based feedback.">
        {error ? <p>{error}</p> : <DataTable columns={winColumns} rows={data} />}
      </Panel>
    </div>
  );
}
