import {
  DataTable,
  DetailPanel,
  FilterBar,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { featuredProduct, productsData } from "@/data/admin/mock-data";
import styles from "../page.module.css";

const productColumns = [
  { key: "id", label: "Product ID" },
  { key: "title", label: "Listing" },
  { key: "seller", label: "Seller" },
  { key: "category", label: "Category" },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <StatusBadge tone={value === "Live" || value === "Featured" ? "good" : value === "Rejected" ? "danger" : "warn"}>
        {value}
      </StatusBadge>
    ),
  },
  { key: "price", label: "Current price" },
  { key: "bids", label: "Bids" },
];

export default function AdminProductsPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Products and listings"
        description="Review listing quality, seller inventory, category placement, and moderation decisions."
        action={<FilterBar items={["Pending approval", "Live", "Featured", "Rejected", "Archived"]} />}
      />

      <section className={styles.mainGrid}>
        <Panel title="Listing control center" description="A moderation-first view of inventory entering the marketplace.">
          <DataTable columns={productColumns} rows={productsData} />
        </Panel>

        <DetailPanel
          title={featuredProduct.title}
          subtitle={`${featuredProduct.seller} · ${featuredProduct.status}`}
          notes={featuredProduct.notes}
          actions={["Approve", "Reject", "Feature", "Unlist", "Inspect seller"]}
        />
      </section>
    </div>
  );
}
