import Link from "next/link";
import styles from "@/components/public/PublicPage.module.css";
import { howItWorksPrinciples, howItWorksSteps } from "@/data/landing-content";

export const metadata = {
  title: "How It Works | AuctionArc",
  description: "See the complete AuctionArc auction journey from registration to payment and delivery.",
};

export default function HowItWorksPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>How It Works</span>
        <h1>The auction flow, step by step.</h1>
        <p>
          From onboarding to delivery, AuctionArc keeps the experience clear for buyers,
          sellers, and administrators who need visibility across the whole marketplace.
        </p>
      </section>

      <section className={styles.card}>
        <h2>Core Principles</h2>
        <ul className={styles.bulletList}>
          {howItWorksPrinciples.map((principle) => (
            <li key={principle}>{principle}</li>
          ))}
        </ul>
      </section>

      <section className={styles.supportGrid}>
        {howItWorksSteps.map((step) => (
          <article key={step.title}>
            <h2>{step.title}</h2>
            <p>{step.body}</p>
          </article>
        ))}
      </section>

      <section className={styles.panel}>
        <h2>Ready to enter the marketplace?</h2>
        <p>
          Create a buyer or seller account to move from the public site into the
          full AuctionArc workspace.
        </p>
        <div className={styles.buttonRow}>
          <Link href="/register" className={styles.submitButton}>
            Create Account
          </Link>
          <Link href="/auctions" className={styles.secondaryButton}>
            Browse Auction Model
          </Link>
        </div>
      </section>
    </div>
  );
}
