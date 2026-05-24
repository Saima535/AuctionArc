import styles from "@/components/public/PublicPage.module.css";

export const metadata = {
  title: "Privacy Policy | AuctionArc",
  description: "Privacy information for AuctionArc users.",
};

const privacySections = [
  {
    title: "Account Information",
    body: "AuctionArc stores account details such as name, email, role, contact details, and profile records to support authentication, marketplace participation, and platform safety.",
  },
  {
    title: "Marketplace Activity",
    body: "Listings, bids, transactions, messages, and support records are kept so the auction experience can function and disputes can be reviewed when needed.",
  },
  {
    title: "Security And Verification",
    body: "Account details may be processed to protect sellers, buyers, and the wider marketplace from fraud or abuse.",
  },
];

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Privacy Policy</span>
        <h1>AuctionArc privacy principles for users and marketplace operations.</h1>
        <p>
          This frontend page provides a clear placeholder policy surface while the
          legal and compliance copy is finalized for production.
        </p>
      </section>

      <section className={styles.supportGrid}>
        {privacySections.map((section) => (
          <article key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
