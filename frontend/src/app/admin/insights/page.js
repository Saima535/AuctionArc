"use client";

import { useState } from "react";
import {
  BarList,
  FilterBar,
  Panel,
  SectionIntro,
  StatCard,
  TrendChart,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import styles from "../page.module.css";

export default function AdminInsightsPage() {
  const [period, setPeriod] = useState("30");
  const { data, error } = useApiData(`/dashboard/admin/insights?period=${period}`, {
    initialData: {
      period: {
        days: 30,
        labels: [],
      },
      insightCards: [],
      insightSeries: {
        marketplaceGrowth: [0, 0, 0, 0, 0, 0, 0],
        bidVolume: [0, 0, 0, 0, 0, 0, 0],
        conversion: [0, 0, 0, 0, 0, 0, 0],
      },
      topPerformers: {
        sellers: [],
        categories: [],
      },
    },
  });

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Insights and trends"
        description="A concise view of marketplace growth, bid demand, conversion performance, and leading categories."
        action={
          <FilterBar
            items={[
              { label: "7 days", value: "7" },
              { label: "30 days", value: "30" },
              { label: "90 days", value: "90" },
            ]}
            activeItem={period}
            onSelect={setPeriod}
          />
        }
      />

      {error ? <p>{error}</p> : null}

      <section className={styles.statGrid}>
        {data.insightCards.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.mainGrid}>
        <Panel title="Marketplace health trend" description="Growth and operating momentum.">
          <TrendChart data={data.insightSeries.marketplaceGrowth} />
        </Panel>
        <Panel title="Bid volume trend" description="Competitive intensity across the active marketplace.">
          <TrendChart data={data.insightSeries.bidVolume} tone="orange" />
        </Panel>
      </section>

      <section className={styles.secondaryGrid}>
        <Panel title="Conversion trend" description="How many listings are moving through to successful outcomes.">
          <TrendChart data={data.insightSeries.conversion} tone="green" />
        </Panel>
        <Panel title="Top sellers" description="Leading marketplace contributors by volume.">
          <BarList items={data.topPerformers.sellers.map((item) => ({ label: item.name, value: item.value || 0 }))} />
        </Panel>
        <Panel title="Top categories" description="Where demand and revenue density are strongest.">
          <BarList items={data.topPerformers.categories.map((item) => ({ label: item.name, value: item.value || 0 }))} />
        </Panel>
      </section>
    </div>
  );
}
