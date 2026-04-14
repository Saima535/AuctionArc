import {
  Panel,
  SectionIntro,
  SettingsGrid,
  StatCard,
} from "@/components/admin/AdminPrimitives";
import { ProfileEditor, SettingsEditor } from "@/components/account/ProfileForms";
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

      <section className={styles.secondaryGrid}>
        <ProfileEditor
          title="Edit admin identity"
          description="Update the super-admin display identity, contact routing, and location details."
          fields={[
            { name: "admin-name", label: "Full name", defaultValue: adminProfile.name },
            { name: "admin-email", label: "Email", type: "email", defaultValue: adminProfile.email },
            { name: "admin-role", label: "Role title", defaultValue: adminProfile.role },
            { name: "admin-location", label: "Location", defaultValue: adminProfile.location },
          ]}
        />
        <SettingsEditor
          title="Security preferences"
          description="Configure admin-facing alerting and security placeholders."
          fields={[
            { name: "admin-2fa", label: "Two-factor mode", type: "select", defaultValue: "Enabled", options: ["Enabled", "Disabled"] },
            { name: "admin-session-timeout", label: "Session timeout", defaultValue: "30 minutes" },
            { name: "admin-audit-email", label: "Audit alert email", type: "email", defaultValue: adminProfile.email },
          ]}
        />
      </section>
    </div>
  );
}
