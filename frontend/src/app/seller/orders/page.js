"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DataTable,
  LiveRefreshControls,
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

const statusFlow = ["Awaiting payout", "In escrow", "Paid", "Awaiting shipment", "Delivered", "Completed"];

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const { data, setData, error, isRefreshing, lastUpdated, refresh } = useApiData("/dashboard/seller/orders", {
    initialData: [],
    refreshIntervalMs: 15000,
    revalidateOnWindowFocus: true,
  });
  const [pageMessage, setPageMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const [busyOrderId, setBusyOrderId] = useState("");
  const live = useLiveRefresh({
    channels: useMemo(() => ["market:orders", user?.id ? `user:${user.id}` : ""], [user?.id]),
    enabled: Boolean(user?.id),
    onEvent: useCallback(() => {
      refresh({ background: true });
    }, [refresh]),
  });

  async function handleAdvanceStatus(row) {
    const currentIndex = statusFlow.indexOf(row.status);
    const nextStatus = statusFlow[currentIndex + 1];

    if (!nextStatus) {
      return;
    }

    setPageError("");
    setPageMessage("");
    setBusyOrderId(row.orderId);

    try {
      const result = await apiRequest(`/dashboard/seller/orders/${row.orderId}`, {
        method: "PATCH",
        body: { status: nextStatus },
      });

      setData((current) =>
        current.map((order) => (order.orderId === row.orderId ? result.data : order)),
      );
      setPageMessage(`${row.item} moved to ${nextStatus}.`);
      refresh({ background: true });
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
    { key: "amount", label: "Amount" },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <StatusBadge tone={value === "Completed" || value === "Delivered" ? "good" : value === "In escrow" || value === "Awaiting shipment" ? "warn" : "neutral"}>
          {value}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        const currentIndex = statusFlow.indexOf(row.status);
        const nextStatus = statusFlow[currentIndex + 1];

        return (
          <button
            type="button"
            className={styles.actionButton}
            disabled={!nextStatus || busyOrderId === row.orderId}
            onClick={() => handleAdvanceStatus(row)}
          >
            {busyOrderId === row.orderId ? "Updating..." : nextStatus ? `Mark ${nextStatus}` : "Complete"}
          </button>
        );
      },
    },
  ];

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Orders"
        description="Monitor sold items, buyer status, escrow state, and payout progress."
        action={
          <LiveRefreshControls
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            lastUpdated={lastUpdated}
            label="Realtime orders + 15s fallback"
            connectionState={live.connectionState}
          />
        }
      />

      {pageError ? <p className={styles.errorText}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successText}>{pageMessage}</p> : null}

      <Panel title="Order pipeline" description="Commercial status for completed or nearly completed sales.">
        {error ? <ApiErrorNotice title="Seller orders unavailable" message={error} /> : <DataTable columns={orderColumns} rows={data} />}
      </Panel>
    </div>
  );
}
