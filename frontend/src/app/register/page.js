import styles from "@/components/public/PublicPage.module.css";
import { RegisterForm } from "@/components/public/RegisterForm";

// Static metadata keeps the public registration route descriptive for browsers
// and search engines without adding any client-side logic here.
export const metadata = {
  title: "Register | AuctionArc",
  description: "Create a seller or buyer AuctionArc account.",
};

export default function RegisterPage() {
  return (
    // The page layout mirrors the other public auth screens: explanatory copy
    // on the left and the live registration form on the right.
    <div className={styles.authWrap}>
      <section className={styles.authCard}>
        <span className={styles.eyebrow}>Create account</span>
        <h1>Register for AuctionArc</h1>
        <p>
          Public registration is available for sellers and buyers, and this form
          now submits directly into the live AuctionArc auth flow.
        </p>
        <ul className={styles.bulletList}>
          <li>Seller accounts will manage auction listings and inventory.</li>
          <li>Buyer accounts will follow listings and place bids.</li>
          <li>Admin accounts are provisioned separately through a private channel.</li>
        </ul>
      </section>

      <section className={styles.authCard}>
        {/* The interactive registration flow lives in the client component below. */}
        <RegisterForm />
      </section>
    </div>
  );
}
