import {
  DataTable,
  FilterBar,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import styles from "@/components/member/MemberDashboard.module.css";
import { sellerListings } from "@/data/member/mock-data";

const listingColumns = [
  { key: "id", label: "Listing ID" },
  { key: "title", label: "Title" },
  { key: "category", label: "Category" },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <StatusBadge tone={value === "Live" || value === "Featured" ? "good" : value === "Draft" ? "neutral" : "warn"}>
        {value}
      </StatusBadge>
    ),
  },
  { key: "reserve", label: "Reserve" },
  { key: "price", label: "Price" },
  { key: "bids", label: "Bids" },
];

export default function SellerListingsPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Listings"
        description="Manage listing status, pricing, reserve readiness, and moderation progress."
        action={<FilterBar items={["All listings", "Live", "Featured", "Pending review", "Drafts"]} />}
      />

      <Panel title="Inventory table" description="Your current marketplace inventory and readiness state.">
        <DataTable columns={listingColumns} rows={sellerListings} />
      </Panel>
    </div>
  );
}
