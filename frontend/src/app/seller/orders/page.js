import {
  DataTable,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import styles from "@/components/member/MemberDashboard.module.css";
import { sellerOrders } from "@/data/member/mock-data";

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
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Orders"
        description="Monitor sold items, buyer status, escrow state, and payout progress."
      />

      <Panel title="Order pipeline" description="Commercial status for completed or nearly completed sales.">
        <DataTable columns={orderColumns} rows={sellerOrders} />
      </Panel>
    </div>
  );
}
