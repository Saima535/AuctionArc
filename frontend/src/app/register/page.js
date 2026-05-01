import styles from "@/components/public/PublicPage.module.css";
import { RegisterForm } from "@/components/public/RegisterForm";

export const metadata = {
  title: "Register | AuctionArc",
  description: "Create a seller or bidder AuctionArc account.",
};

export default function RegisterPage() {
  return (
    <div className={styles.authWrap}>
      <section className={styles.authCard}>
        <span className={styles.eyebrow}>Create account</span>
        <h1>Register for AuctionArc</h1>
        <p>
          Public registration is available for sellers and bidders, and this form
          now submits directly into the live AuctionArc auth flow.
        </p>
        <ul className={styles.bulletList}>
          <li>Seller accounts will manage auction listings and inventory.</li>
          <li>Bidder accounts will follow listings and place bids.</li>
          <li>Admin accounts are provisioned separately through a private channel.</li>
        </ul>
      </section>

      <section className={styles.authCard}>
        <RegisterForm />
      </section>
    </div>
  );
}
