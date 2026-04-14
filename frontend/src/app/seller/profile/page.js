import {
  Panel,
  SectionIntro,
  SettingsGrid,
  StatCard,
} from "@/components/admin/AdminPrimitives";
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
    </div>
  );
}
