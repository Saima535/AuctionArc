import {
  ActivityFeed,
  BarList,
  Panel,
  SectionIntro,
  StatCard,
  StatusBadge,
  TrendChart,
} from "@/components/admin/AdminPrimitives";
import { adminOverview, insightSeries } from "@/data/admin/mock-data";
import styles from "./page.module.css";

export default function AdminDashboardPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Marketplace overview"
        description="A high-signal dashboard for platform health, urgent incidents, user growth, and operating pressure."
      />

      <section className={styles.statGrid}>
        {adminOverview.kpis.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.mainGrid}>
        <Panel title="Marketplace growth" description="Auction activity trend over the current operating window.">
          <TrendChart data={insightSeries.marketplaceGrowth} />
        </Panel>

        <Panel title="Urgent alerts" description="Items that need super-admin attention right now.">
          <div className={styles.alertList}>
            {adminOverview.alerts.map((alert) => (
              <article key={alert.title} className={styles.alertCard}>
                <div className={styles.alertHeader}>
                  <strong>{alert.title}</strong>
                  <StatusBadge tone={alert.level === "high" ? "danger" : alert.level === "medium" ? "warn" : "good"}>
                    {alert.level}
                  </StatusBadge>
                </div>
                <p>{alert.body}</p>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <section className={styles.secondaryGrid}>
        <Panel title="Recent admin activity" description="What the marketplace team has been doing lately.">
          <ActivityFeed items={adminOverview.activity} />
        </Panel>

        <Panel title="Top categories" description="Auction demand by category and visibility.">
          <BarList items={adminOverview.categories} />
        </Panel>
      </section>

      <section className={styles.secondaryGrid}>
        <Panel title="Recent registrations" description="Newest sellers and bidders entering the marketplace.">
          <div className={styles.compactList}>
            {adminOverview.registrations.map((user) => (
              <article key={`${user.name}-${user.role}`} className={styles.compactCard}>
                <div>
                  <strong>{user.name}</strong>
                  <p>
                    {user.role} · {user.country}
                  </p>
                </div>
                <StatusBadge tone={user.status === "Active" ? "good" : user.status === "Flagged" ? "danger" : "warn"}>
                  {user.status}
                </StatusBadge>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Support queue snapshot" description="Queue health by operational stream.">
          <div className={styles.compactList}>
            {adminOverview.supportQueue.map((item) => (
              <article key={item.queue} className={styles.compactCard}>
                <div>
                  <strong>{item.queue}</strong>
                  <p>
                    {item.open} open · SLA {item.sla}
                  </p>
                </div>
                <StatusBadge tone={item.status === "Attention needed" ? "danger" : item.status === "Busy" ? "warn" : "good"}>
                  {item.status}
                </StatusBadge>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
