import {
  Panel,
  SectionIntro,
  SettingsGrid,
  StatCard,
} from "@/components/admin/AdminPrimitives";
import styles from "../page.module.css";
import { adminProfile } from "@/data/admin/mock-data";

export default function AdminProfilePage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Admin profile"
        description={`Manage ${adminProfile.name}'s identity, security posture, and audit-facing admin preferences.`}
      />

      <section className={styles.statGrid}>
        {adminProfile.stats.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.secondaryGrid}>
        <Panel title="Identity summary" description="Core admin account details and contact surface.">
          <div className={styles.compactList}>
            {[
              `Name: ${adminProfile.name}`,
              `Role: ${adminProfile.role}`,
              `Email: ${adminProfile.email}`,
              `Location: ${adminProfile.location}`,
            ].map((item) => (
              <article key={item} className={styles.compactCard}>
                <div>
                  <strong>{item}</strong>
                  <p>Frontend-ready summary block for future editable profile controls.</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Admin profile controls" description="Identity and security modules prepared for backend wiring.">
          <SettingsGrid sections={adminProfile.sections} />
        </Panel>
      </section>
    </div>
  );
}
