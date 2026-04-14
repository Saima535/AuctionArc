import {
  Panel,
  SectionIntro,
  SettingsGrid,
  StatCard,
} from "@/components/admin/AdminPrimitives";
import { ProfileEditor, SettingsEditor } from "@/components/account/ProfileForms";
import styles from "@/components/member/MemberDashboard.module.css";
import { sellerProfile } from "@/data/member/mock-data";

export default function SellerProfilePage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Seller profile"
        description="Control storefront identity, verification details, and how buyers experience your seller presence."
      />

      <section className={styles.statGrid}>
        {sellerProfile.stats.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.secondaryGrid}>
        <Panel title="Profile summary" description="Key seller identity and trust information.">
          <div className={styles.compactList}>
            {[
              `Store: ${sellerProfile.name}`,
              `Role: ${sellerProfile.role}`,
              `Email: ${sellerProfile.email}`,
              `Location: ${sellerProfile.location}`,
            ].map((item) => (
              <article key={item} className={styles.compactCard}>
                <div>
                  <strong>{item}</strong>
                  <p>Prepared for future editable profile and storefront controls.</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Seller profile modules" description="Profile and trust systems designed for later backend integration.">
          <SettingsGrid sections={sellerProfile.sections} />
        </Panel>
      </section>

      <section className={styles.secondaryGrid}>
        <ProfileEditor
          title="Edit storefront profile"
          description="Maintain the seller storefront identity, business details, and public trust presentation."
          fields={[
            { name: "seller-name", label: "Store name", defaultValue: sellerProfile.name },
            { name: "seller-email", label: "Public email", type: "email", defaultValue: sellerProfile.email },
            { name: "seller-role", label: "Seller label", defaultValue: sellerProfile.role },
            { name: "seller-location", label: "Location", defaultValue: sellerProfile.location },
          ]}
        />
        <SettingsEditor
          title="Storefront controls"
          description="Set storefront-level visibility defaults and response expectations."
          fields={[
            { name: "seller-response-window", label: "Preferred response window", defaultValue: "Within 1 hour" },
            { name: "seller-featured", label: "Featured appearance", type: "select", defaultValue: "Enabled", options: ["Enabled", "Disabled"] },
            { name: "seller-notifications", label: "Bid alert mode", type: "select", defaultValue: "Instant", options: ["Instant", "Hourly", "Daily"] },
          ]}
        />
      </section>
    </div>
  );
}
