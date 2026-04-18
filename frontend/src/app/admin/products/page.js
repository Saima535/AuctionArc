"use client";

import {
  DataTable,
  DetailPanel,
  FilterBar,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
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
  const { data, error } = useApiData("/admin/products", {
    initialData: [],
  });
  const featuredProduct = data[0];

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Products and listings"
        description="Review listing quality, seller inventory, category placement, and moderation decisions."
        action={<FilterBar items={["Pending approval", "Live", "Featured", "Rejected", "Archived"]} />}
      />

      {error ? <p>{error}</p> : null}

      <section className={styles.mainGrid}>
        <Panel title="Listing control center" description="A moderation-first view of inventory entering the marketplace.">
          <DataTable columns={productColumns} rows={data} />
        </Panel>

        {featuredProduct ? (
          <DetailPanel
            title={featuredProduct.title}
            subtitle={`${featuredProduct.seller} · ${featuredProduct.status}`}
            notes={[
              `${featuredProduct.category} listing`,
              `${featuredProduct.price} current price`,
              `${featuredProduct.bids} bids recorded`,
            ]}
            actions={["Approve", "Reject", "Feature", "Unlist", "Inspect seller"]}
          />
        ) : null}
      </section>
    </div>
  );
}
