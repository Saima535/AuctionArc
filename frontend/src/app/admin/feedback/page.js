"use client";

import {
  DataTable,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { ApiErrorNotice } from "@/components/feedback/ApiFeedback";
import { useApiData } from "@/hooks/useApiData";
import styles from "@/components/member/MemberDashboard.module.css";

function ratingTone(value) {
  return value >= 4 ? "good" : value === 3 ? "warn" : "danger";
}

export default function AdminFeedbackPage() {
  const { data, error } = useApiData("/admin/feedback", {
    initialData: [],
    refreshIntervalMs: 15000,
    revalidateOnWindowFocus: true,
  });

  const columns = [
    { key: "id", label: "Feedback ID" },
    { key: "order", label: "Order" },
    { key: "product", label: "Product" },
    { key: "direction", label: "Direction" },
    { key: "from", label: "From" },
    { key: "to", label: "To" },
    {
      key: "rating",
      label: "Rating",
      render: (_, row) => <StatusBadge tone={ratingTone(row.ratingValue)}>{row.rating}</StatusBadge>,
    },
    {
      key: "comment",
      label: "Feedback",
      render: (value) => <div style={{ whiteSpace: "normal", minWidth: "240px" }}>{value}</div>,
    },
    {
      key: "orderStatus",
      label: "Order Status",
      render: (value) => <StatusBadge tone={/completed|delivered|paid/i.test(value) ? "good" : /awaiting/i.test(value) ? "warn" : "neutral"}>{value}</StatusBadge>,
    },
    { key: "purchaseType", label: "Purchase Type" },
    { key: "submittedAt", label: "Submitted" },
  ];

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Ratings and Feedback"
        description="Review real buyer-to-seller and seller-to-buyer ratings linked to completed marketplace orders."
      />

      <Panel title="Feedback ledger" description="Every rating shown here is tied to a real paid or delivered order and can be traced back to the buyer-seller pair involved.">
        {error ? <ApiErrorNotice title="Admin feedback unavailable" message={error} /> : <DataTable columns={columns} rows={data} />}
      </Panel>
    </div>
  );
}
