import {
  Panel,
  SectionIntro,
  SettingsGrid,
  StatCard,
} from "@/components/admin/AdminPrimitives";
import { ProfileEditor, SettingsEditor } from "@/components/account/ProfileForms";
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

      <section className={styles.secondaryGrid}>
        <ProfileEditor
          title="Edit bidder profile"
          description="Maintain bidder identity, profile visibility, and preference-facing account details."
          fields={[
            { name: "bidder-name", label: "Full name", defaultValue: bidderProfile.name },
            { name: "bidder-email", label: "Email", type: "email", defaultValue: bidderProfile.email },
            { name: "bidder-role", label: "Account label", defaultValue: bidderProfile.role },
            { name: "bidder-location", label: "Location", defaultValue: bidderProfile.location },
          ]}
        />
        <SettingsEditor
          title="Bidding preferences"
          description="Control bidder-side communication and discovery preferences."
          fields={[
            { name: "bidder-alerts", label: "Outbid alerts", type: "select", defaultValue: "Instant", options: ["Instant", "Hourly", "Daily"] },
            { name: "bidder-categories", label: "Preferred categories", defaultValue: "Vehicles, Collectibles" },
            { name: "bidder-currency", label: "Preferred currency", defaultValue: "USD" },
          ]}
        />
      </section>
    </div>
  );
}
