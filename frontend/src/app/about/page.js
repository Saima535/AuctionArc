import styles from "@/components/public/PublicPage.module.css";
import { aboutHighlights } from "@/data/site-content";

export const metadata = {
  title: "About | AuctionArc",
  description: "Learn what AuctionArc is building for sellers, bidders, and admins.",
};

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>About AuctionArc</span>
        <h1>AuctionArc is being shaped as a focused auction management system.</h1>
        <p>
          The platform is aimed at creating a more organized and transparent
          auction experience by giving each actor a clear place in the system.
        </p>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.card}>
          <h2>What the platform is solving</h2>
          <ul className={styles.bulletList}>
            {aboutHighlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </section>

        <aside className={styles.panel}>
          <h2>Current phase</h2>
          <ul className={styles.metaList}>
            <li>Frontend design and route structure are in progress.</li>
            <li>Backend and business logic will follow in a later phase.</li>
            <li>The product is being built with organized role separation in mind.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
