"use client";

import {
  Panel,
  SectionIntro,
  StatCard,
  TrendChart,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import styles from "@/components/member/MemberDashboard.module.css";

export default function SellerAnalyticsPage() {
  const { data, error } = useApiData("/dashboard/seller/analytics", {
    initialData: {
      kpis: [],
      series: {
        views: [0, 0, 0, 0, 0, 0, 0],
        bids: [0, 0, 0, 0, 0, 0, 0],
        conversion: [0, 0, 0, 0, 0, 0, 0],
      },
    },
  });

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Analytics"
        description="Track listing visibility, bidder attention, and conversion trends across your selling activity."
      />

      {error ? <p>{error}</p> : null}

      <section className={styles.statGrid}>
        {data.kpis.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.mainGrid}>
        <Panel title="Views trend" description="Traffic momentum across your visible inventory.">
          <TrendChart data={data.series.views} />
        </Panel>
        <Panel title="Bid trend" description="How competitive your auctions are becoming.">
          <TrendChart data={data.series.bids} tone="orange" />
        </Panel>
      </section>

      <Panel title="Conversion trend" description="How listing attention is turning into real auction activity.">
        <TrendChart data={data.series.conversion} tone="green" />
      </Panel>
    </div>
  );
}
