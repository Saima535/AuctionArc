import styles from "@/components/public/PublicPage.module.css";

export const metadata = {
  title: "Terms of Service | AuctionArc",
  description: "Terms of service for AuctionArc marketplace participation.",
};

const termsSections = [
  {
    title: "Marketplace Roles",
    body: "AuctionArc supports sellers, bidders, and administrators with different permissions and responsibilities across the platform.",
  },
  {
    title: "Auction Participation",
    body: "Users are expected to participate honestly, respect bidding rules, and avoid fraudulent, abusive, or manipulative behavior.",
  },
  {
    title: "Payments And Fulfillment",
    body: "Transactions, payouts, refunds, and delivery-related actions are subject to platform rules, review flows, and future production payment policies.",
  },
];

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Terms of Service</span>
        <h1>Core rules for using the AuctionArc marketplace.</h1>
        <p>
          This page gives the project a valid terms route now and can be replaced
          with final legal copy later without changing navigation structure.
        </p>
      </section>

      <section className={styles.supportGrid}>
        {termsSections.map((section) => (
          <article key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
