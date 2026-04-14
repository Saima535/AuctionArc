import {
  DataTable,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import styles from "@/components/member/MemberDashboard.module.css";
import { bidderWins } from "@/data/member/mock-data";

const winColumns = [
  { key: "id", label: "Win ID" },
  { key: "item", label: "Item" },
  { key: "seller", label: "Seller" },
  { key: "amount", label: "Amount" },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <StatusBadge tone={value === "Delivered" || value === "Paid" ? "good" : "warn"}>
        {value}
      </StatusBadge>
    ),
  },
];

export default function BidderWinsPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Wins"
        description="Review auctions you have won, payment status, and fulfillment progress."
      />

      <Panel title="Won auctions" description="Commercial follow-through after successful bidding.">
        <DataTable columns={winColumns} rows={bidderWins} />
      </Panel>
    </div>
  );
}
