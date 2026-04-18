import styles from "./page.module.css";

const howItWorks = [
  {
    title: "1. Register",
    body: "Create an account as a buyer or seller and complete your profile.",
  },
  {
    title: "2. Browse / List",
    body: "Buyers explore auctions while sellers publish listings and set auction details.",
  },
  {
    title: "3. Place Bid",
    body: "Join manually or compete using structured bidding and timed auction flow.",
  },
  {
    title: "4. Win & Pay",
    body: "Winning bids move into secure payment and escrow handling.",
  },
  {
    title: "5. Delivery",
    body: "Seller ships the item and the buyer confirms receipt to complete the auction cycle.",
  },
];

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
            <a href="#auctions" className={styles.primaryAction}>
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
          <article className={styles.valueCard}>
            <h3>Real-Time Bidding</h3>
            <p>Stay in the action with live auction movement, structured bid flow, and fast updates.</p>
          </article>
          <article className={styles.valueCard}>
            <h3>Seller Control</h3>
            <p>Create listings, launch auctions, and manage order progress inside one focused workspace.</p>
          </article>
          <article className={styles.valueCard}>
            <h3>Secure Payments</h3>
            <p>Keep transactions organized with escrow-aware handling and platform-level oversight.</p>
          </article>
        </div>
      </section>

      <section className={styles.section} id="how-it-works">
        <div className={styles.sectionHeading}>
          <span>How It Works</span>
          <h2>From sign-up to delivery, the full auction cycle stays simple and clear.</h2>
        </div>

        <div className={styles.stepsGrid}>
          {howItWorks.map((step, index) => (
            <article
              key={step.title}
              className={index === howItWorks.length - 1 ? styles.stepCardWide : styles.stepCard}
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
