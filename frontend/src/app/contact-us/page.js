import styles from "@/components/public/PublicPage.module.css";
import { contactCards } from "@/data/site-content";

export const metadata = {
  title: "Contact Us | AuctionArc",
  description: "Contact the AuctionArc team for product and project inquiries.",
};

export default function ContactUsPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Contact us</span>
        <h1>Reach the AuctionArc team for questions, planning, or feedback.</h1>
        <p>
          This page gives the project a clean communication entry point while we
          continue building the rest of the auction platform.
        </p>
      </section>

      <section className={styles.contactGrid}>
        {contactCards.map((card) => (
          <article key={card.title}>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
            <p className={styles.linkText}>{card.detail}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
