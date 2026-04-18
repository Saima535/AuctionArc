"use client";

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
  const { data, error } = useApiData("/dashboard/admin/insights", {
    initialData: {
      insightCards: [],
      insightSeries: {
        marketplaceGrowth: [0, 0, 0, 0, 0, 0, 0],
        bidVolume: [0, 0, 0, 0, 0, 0, 0],
        conversion: [0, 0, 0, 0, 0, 0, 0],
        fraudSignals: [0, 0, 0, 0, 0, 0, 0],
      },
      topPerformers: {
        sellers: [],
        categories: [],
        products: [],
      },
    },
  });

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Insights and trends"
        description="Deeper operational analytics for marketplace growth, bid behavior, conversion performance, and fraud signals."
        action={<FilterBar items={["7 days", "30 days", "90 days", "Custom range"]} />}
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

      <section className={styles.mainGrid}>
        <Panel title="Listing conversion trend" description="How many listings are moving through to successful outcomes.">
          <TrendChart data={data.insightSeries.conversion} tone="green" />
        </Panel>
        <Panel title="Fraud signal trend" description="Operational monitoring for suspicious platform behavior.">
          <TrendChart data={data.insightSeries.fraudSignals} tone="orange" />
        </Panel>
      </section>

      <section className={styles.secondaryGrid}>
        <Panel title="Top sellers" description="Leading marketplace contributors by volume.">
          <BarList items={data.topPerformers.sellers.map((item, index) => ({ label: item.name, value: 100 - index * 18 }))} />
        </Panel>
        <Panel title="Top categories" description="Where demand and revenue density are strongest.">
          <BarList items={data.topPerformers.categories.map((item, index) => ({ label: item.name, value: 90 - index * 15 }))} />
        </Panel>
      </section>

      <Panel title="Trending products" description="Highest-intent products on the platform right now.">
        <div className={styles.compactList}>
          {data.topPerformers.products.map((product) => (
            <article key={product.name} className={styles.compactCard}>
              <div>
                <strong>{product.name}</strong>
                <p>{product.metric}</p>
              </div>
              <strong>{product.status}</strong>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
