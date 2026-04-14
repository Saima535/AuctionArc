import {
  FilterBar,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import styles from "@/components/member/MemberDashboard.module.css";
import { bidderDiscover } from "@/data/member/mock-data";

export default function BidderDiscoverPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Discover"
        description="Browse promising auctions and trending opportunities that match your buying interest."
        action={<FilterBar items={["All", "Vehicles", "Collectibles", "Industrial", "Trending"]} />}
      />

      <div className={styles.compactList}>
        {bidderDiscover.map((item) => (
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
