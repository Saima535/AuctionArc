"use client";

import {
  DataTable,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import styles from "@/components/member/MemberDashboard.module.css";

const orderColumns = [
  { key: "id", label: "Order ID" },
  { key: "item", label: "Item" },
  { key: "buyer", label: "Buyer" },
  { key: "amount", label: "Amount" },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <StatusBadge tone={value === "Completed" ? "good" : value === "In escrow" ? "warn" : "neutral"}>
        {value}
      </StatusBadge>
    ),
  },
];

export default function SellerOrdersPage() {
  const { data, error } = useApiData("/dashboard/seller/orders", {
    initialData: [],
  });

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Orders"
        description="Monitor sold items, buyer status, escrow state, and payout progress."
      />

      <Panel title="Order pipeline" description="Commercial status for completed or nearly completed sales.">
        {error ? <p>{error}</p> : <DataTable columns={orderColumns} rows={data} />}
      </Panel>
    </div>
  );
}
