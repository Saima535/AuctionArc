"use client";

import {
  FilterBar,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import styles from "@/components/member/MemberDashboard.module.css";

export default function BidderDiscoverPage() {
  const { data, error } = useApiData("/dashboard/bidder/discover", {
    initialData: [],
  });

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Discover"
        description="Browse promising auctions and trending opportunities that match your buying interest."
        action={<FilterBar items={["All", "Vehicles", "Collectibles", "Industrial", "Trending"]} />}
      />

      {error ? <p>{error}</p> : null}

      <div className={styles.compactList}>
        {data.map((item) => (
          <article key={item.id} className={styles.compactCard}>
            <div>
              <strong>{item.title}</strong>
              <p>
                {item.category} | {item.price}
              </p>
            </div>
            <StatusBadge tone={item.interest === "Hot" ? "danger" : item.interest === "High" ? "warn" : "good"}>
              {item.stage}
            </StatusBadge>
          </article>
        ))}
      </div>
    </div>
  );
}
