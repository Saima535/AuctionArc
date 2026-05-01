import styles from "./page.module.css";
import { auctionHighlights, howItWorksSteps } from "@/data/landing-content";

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero} id="hero">
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Next-generation auction platform</span>
          <h1>
            Bid Smart.
            <br />
            Win Big.
          </h1>
          <p>
            A black-and-gold marketplace experience built for real-time bidding,
            organized auction management, and secure buyer-seller flow.
          </p>

          <div className={styles.heroActions}>
            <a href="/auctions" className={styles.primaryAction}>
              Explore
            </a>
            <a href="/login" className={styles.secondaryAction}>
              Sign In
            </a>
          </div>
        </div>

        <div className={styles.heroVisualWrap}>
          <div className={styles.heroVisual}>
            <div className={styles.heroGlow} />
            <div className={styles.heroImageCard}>
              <div className={styles.coinCluster}>
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className={styles.gavel} />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="auctions">
        <div className={styles.sectionHeading}>
          <span>Marketplace flow</span>
          <h2>Everything is designed around a fast, focused auction experience.</h2>
        </div>

        <div className={styles.valueGrid}>
          {auctionHighlights.map((highlight) => (
            <article key={highlight.title} className={styles.valueCard}>
              <h3>{highlight.title}</h3>
              <p>{highlight.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="how-it-works">
        <div className={styles.sectionHeading}>
          <span>How It Works</span>
          <h2>From sign-up to delivery, the full auction cycle stays simple and clear.</h2>
        </div>

        <div className={styles.stepsGrid}>
          {howItWorksSteps.map((step, index) => (
            <article
              key={step.title}
              className={index === howItWorksSteps.length - 1 ? styles.stepCardWide : styles.stepCard}
            >
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
