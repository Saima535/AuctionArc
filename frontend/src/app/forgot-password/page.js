import styles from "@/components/public/PublicPage.module.css";
import { ForgotPasswordForm } from "@/components/public/ForgotPasswordForm";

export const metadata = {
  title: "Forgot Password | AuctionArc",
  description: "Request a password reset for a seller or bidder account.",
};

export default function ForgotPasswordPage() {
  return (
    <div className={styles.authWrap}>
      <section className={styles.authCard}>
        <span className={styles.eyebrow}>Password recovery</span>
        <h1>Forgot your password?</h1>
        <p>
          Request a password reset link for your seller or bidder account.
          Admin recovery should remain separate from this public flow.
        </p>
        <ul className={styles.bulletList}>
          <li>This recovery page is for sellers and bidders only.</li>
          <li>Admin password recovery should be handled through a private support path.</li>
          <li>The current flow is frontend-ready and prepared for backend token reset handling.</li>
        </ul>
      </section>

      <section className={styles.authCard}>
        <ForgotPasswordForm />
      </section>
    </div>
  );
}
