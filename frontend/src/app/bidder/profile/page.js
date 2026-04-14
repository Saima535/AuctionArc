import {
  Panel,
  SectionIntro,
  SettingsGrid,
  StatCard,
} from "@/components/admin/AdminPrimitives";
import styles from "@/components/member/MemberDashboard.module.css";
import { bidderProfile } from "@/data/member/mock-data";

export default function BidderProfilePage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Bidder profile"
        description="Manage bidder identity, verification, communication preferences, and buying profile settings."
      />

      <section className={styles.statGrid}>
        {bidderProfile.stats.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.secondaryGrid}>
        <Panel title="Profile summary" description="Core bidder identity and account trust information.">
          <div className={styles.compactList}>
            {[
              `Name: ${bidderProfile.name}`,
              `Role: ${bidderProfile.role}`,
              `Email: ${bidderProfile.email}`,
              `Location: ${bidderProfile.location}`,
            ].map((item) => (
              <article key={item} className={styles.compactCard}>
                <div>
                  <strong>{item}</strong>
                  <p>Prepared for future editable bidder identity and preference controls.</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Bidder profile modules" description="Identity, communication, and preference systems prepared for backend integration.">
          <SettingsGrid sections={bidderProfile.sections} />
        </Panel>
      </section>
    </div>
  );
}
