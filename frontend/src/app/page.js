import styles from "./page.module.css";
import { featureHighlights, roleCards } from "@/data/homepage-content";

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero} id="hero">
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Auction management system</span>
          <h1>Run every auction journey inside one organized platform.</h1>
          <p>
            AuctionArc brings sellers, bidders, and admins into a single
            experience designed for clarity, momentum, and trustworthy auction
            operations.
          </p>

          <div className={styles.heroActions}>
            <a href="#roles" className={styles.primaryAction}>
              View Roles
            </a>
            <a href="#features" className={styles.secondaryAction}>
              See Features
            </a>
          </div>
        </div>

        <div className={styles.heroPanel}>
          <p className={styles.panelLabel}>Platform focus</p>
          <ul className={styles.featureList}>
            {featureHighlights.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.section} id="roles">
        <div className={styles.sectionHeading}>
          <span>Core actors</span>
          <h2>Built around the three people who make the marketplace work.</h2>
        </div>

        <div className={styles.roleGrid}>
          {roleCards.map((role) => (
            <article key={role.title} className={styles.roleCard}>
              <p className={styles.roleTitle}>{role.title}</p>
              <h3>{role.label}</h3>
              <p>{role.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="features">
        <div className={styles.sectionHeading}>
          <span>Why this foundation works</span>
          <h2>A homepage structure that is ready to grow into a full product.</h2>
        </div>

        <div className={styles.valueGrid}>
          <article className={styles.valueCard}>
            <h3>Reusable layout</h3>
            <p>
              The navbar and footer now live in shared components so future
              screens can stay consistent without repeating layout code.
            </p>
          </article>
          <article className={styles.valueCard}>
            <h3>Organized content</h3>
            <p>
              Homepage content is separated from presentation, making it easier
              to expand role-specific messaging as the frontend evolves.
            </p>
          </article>
          <article className={styles.valueCard} id="how-it-works">
            <h3>Clear next step</h3>
            <p>
              This setup gives us a stable base for upcoming pages like login,
              role dashboards, auction listings, and admin controls.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
