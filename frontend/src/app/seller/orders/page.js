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
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        const nextStatus = nextStatusByCurrent[row.status];

        return (
          <button
            type="button"
            className={styles.actionButton}
            disabled={!nextStatus || busyOrderId === row.orderId}
            onClick={() => handleAdvanceStatus(row)}
          >
            {busyOrderId === row.orderId ? "Updating..." : nextStatus ? `Mark ${nextStatus}` : row.status === "Payment pending" ? "Waiting for payment" : "Complete"}
          </button>
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

      <Panel title="Order pipeline" description="Track buyer payment, seller payout after commission, and fulfilment progress after a successful sale.">
        {error ? <ApiErrorNotice title="Seller orders unavailable" message={error} /> : <DataTable columns={orderColumns} rows={data} />}
      </Panel>
    </div>
  );
}
