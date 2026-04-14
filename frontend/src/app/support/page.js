import styles from "@/components/public/PublicPage.module.css";
import { supportOptions } from "@/data/site-content";

export const metadata = {
  title: "Support | AuctionArc",
  description: "Find support categories for sellers, bidders, admins, and technical help.",
};

export default function SupportPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Support</span>
        <h1>Support topics prepared for every role in AuctionArc.</h1>
        <p>
          As the system grows, this page can become the entry point for FAQs,
          guides, issue reporting, and account assistance.
        </p>
      </section>

      <section className={styles.supportGrid}>
        {supportOptions.map((option) => (
          <article key={option.title}>
            <h2>{option.title}</h2>
            <p>{option.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
