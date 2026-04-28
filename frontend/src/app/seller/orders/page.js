"use client";

import { useState } from "react";
import {
  DataTable,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "@/components/member/MemberDashboard.module.css";

const statusFlow = ["Awaiting payout", "In escrow", "Paid", "Awaiting shipment", "Delivered", "Completed"];

export default function SellerOrdersPage() {
  const { data, setData, error } = useApiData("/dashboard/seller/orders", {
    initialData: [],
  });
  const [pageMessage, setPageMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const [busyOrderId, setBusyOrderId] = useState("");

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
      />

      {pageError ? <p className={styles.errorText}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successText}>{pageMessage}</p> : null}

      <Panel title="Order pipeline" description="Commercial status for completed or nearly completed sales.">
        {error ? <p>{error}</p> : <DataTable columns={orderColumns} rows={data} />}
      </Panel>
    </div>
  );
}
