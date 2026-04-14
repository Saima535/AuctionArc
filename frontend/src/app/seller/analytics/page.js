import {
  Panel,
  SectionIntro,
  StatCard,
  TrendChart,
} from "@/components/admin/AdminPrimitives";
import styles from "@/components/member/MemberDashboard.module.css";
import { sellerAnalytics } from "@/data/member/mock-data";

export default function SellerAnalyticsPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Analytics"
        description="Track listing visibility, bidder attention, and conversion trends across your selling activity."
      />

      <section className={styles.statGrid}>
        <StatCard label="Listing views" value="4.8K" delta="+18%" tone="good" />
        <StatCard label="Bid engagement" value="216" delta="+11%" tone="good" />
        <StatCard label="Conversion rate" value="30%" delta="+4.2%" tone="good" />
        <StatCard label="Drop-off risk" value="9%" delta="-2%" tone="warn" />
      </section>

      <section className={styles.mainGrid}>
        <Panel title="Views trend" description="Traffic momentum across your visible inventory.">
          <TrendChart data={sellerAnalytics.views} />
        </Panel>
        <Panel title="Bid trend" description="How competitive your auctions are becoming.">
          <TrendChart data={sellerAnalytics.bids} tone="orange" />
        </Panel>
      </section>

      <Panel title="Conversion trend" description="How listing attention is turning into real auction activity.">
        <TrendChart data={sellerAnalytics.conversion} tone="green" />
      </Panel>
    </div>
  );
}
