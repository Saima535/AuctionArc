"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DataTable,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiErrorNotice } from "@/components/feedback/ApiFeedback";
import { useApiData } from "@/hooks/useApiData";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { apiRequest } from "@/lib/api";
import styles from "@/components/member/MemberDashboard.module.css";

const nextStatusByCurrent = {
  "Paid": "Awaiting shipment",
  "Awaiting shipment": "Delivered",
  "Delivered": "Completed",
};

function payoutTone(value) {
  return /completed|released/i.test(value)
    ? "good"
    : /pending/i.test(value)
      ? "warn"
      : "neutral";
}

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const { data, setData, error, refresh } = useApiData("/dashboard/seller/orders", {
    initialData: [],
    refreshIntervalMs: 15000,
    revalidateOnWindowFocus: true,
  });
  const [pageMessage, setPageMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const [busyOrderId, setBusyOrderId] = useState("");
  const [feedbackOrderId, setFeedbackOrderId] = useState("");
  const [feedbackRating, setFeedbackRating] = useState("5");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackBusyOrderId, setFeedbackBusyOrderId] = useState("");
  useLiveRefresh({
    channels: useMemo(() => ["market:orders", user?.id ? `user:${user.id}` : ""], [user?.id]),
    enabled: Boolean(user?.id),
    onEvent: useCallback(() => {
      refresh({ background: true });
    }, [refresh]),
  });

  async function handleAdvanceStatus(row) {
    const nextStatus = nextStatusByCurrent[row.status];

    if (!nextStatus) {
      return;
    }

    setPageError("");
    setPageMessage("");
    setBusyOrderId(row.orderId);

    try {
      await apiRequest(`/dashboard/seller/orders/${row.orderId}`, {
        method: "PATCH",
        body: { status: nextStatus },
      });

      setPageMessage(`${row.item} moved to ${nextStatus}.`);
      await refresh({ background: true });
    } catch (requestError) {
      setPageError(requestError.message || "Could not update the order status.");
    } finally {
      setBusyOrderId("");
    }
  }

  async function handleSubmitFeedback(row) {
    setPageError("");
    setPageMessage("");
    setFeedbackBusyOrderId(row.orderId);

    try {
      await apiRequest(`/dashboard/seller/orders/${row.orderId}/feedback`, {
        method: "POST",
        body: {
          rating: Number(feedbackRating),
          comment: feedbackComment,
        },
      });

      setPageMessage(`Feedback for ${row.item} was sent to the buyer.`);
      setFeedbackOrderId("");
      setFeedbackRating("5");
      setFeedbackComment("");
      await refresh({ background: true });
    } catch (requestError) {
      setPageError(requestError.message || "Could not submit buyer feedback.");
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

  const orderColumns = [
    { key: "id", label: "Order ID" },
    { key: "item", label: "Item" },
    { key: "buyer", label: "Buyer" },
    { key: "grossAmount", label: "Sale" },
    { key: "commission", label: "Commission" },
    { key: "payoutAmount", label: "Payout" },
    {
      key: "payoutStatus",
      label: "Payout Status",
      render: (value) => (
        <StatusBadge tone={payoutTone(value)}>
          {value}
        </StatusBadge>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <StatusBadge tone={value === "Completed" || value === "Delivered" ? "good" : value === "Payment pending" || value === "Awaiting shipment" ? "warn" : "neutral"}>
          {value}
        </StatusBadge>
      ),
    },
    {
      key: "feedback",
      label: "Feedback",
      render: (_, row) => (
        <div className={styles.feedbackStack} style={{ whiteSpace: "normal" }}>
          {row.feedbackLeft ? renderFeedbackCard("You rated buyer", row.feedbackLeft) : null}
          {row.feedbackReceived ? renderFeedbackCard("Buyer rated you", row.feedbackReceived) : null}
          {!row.feedbackLeft && !row.feedbackReceived ? (
            <span className={styles.feedbackHint}>No feedback has been exchanged for this order yet.</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        const nextStatus = nextStatusByCurrent[row.status];

        return (
          <div className={styles.feedbackStack} style={{ whiteSpace: "normal" }}>
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.actionButton}
                disabled={!nextStatus || busyOrderId === row.orderId}
                onClick={() => handleAdvanceStatus(row)}
              >
                {busyOrderId === row.orderId ? "Updating..." : nextStatus ? `Mark ${nextStatus}` : row.status === "Payment pending" ? "Waiting for payment" : "Complete"}
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
                  {feedbackOrderId === row.orderId ? "Close feedback" : "Rate buyer"}
                </button>
              ) : !row.feedbackLeft ? (
                <span className={styles.feedbackHint}>
                  Feedback opens after the buyer has paid.
                </span>
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
                  placeholder="Share optional feedback about the buyer."
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
        );
      },
    },
  ];

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Orders"
        description="Monitor sold items, buyer payment, 5% commission deductions, payout totals, and auto-released seller payouts after delivery."
      />

      {pageError ? <p className={styles.errorText}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successText}>{pageMessage}</p> : null}

      <Panel title="Order pipeline" description="Track buyer payment, seller payout after commission, fulfilment progress, and seller-to-buyer feedback after payment.">
        {error ? <ApiErrorNotice title="Seller orders unavailable" message={error} /> : <DataTable columns={orderColumns} rows={data} />}
      </Panel>
    </div>
  );
}
