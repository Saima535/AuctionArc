import styles from "@/components/public/PublicPage.module.css";
import { ResetPasswordForm } from "@/components/public/ResetPasswordForm";

export const metadata = {
  title: "Reset Password | AuctionArc",
  description: "Reset your seller or bidder AuctionArc password.",
};

export default function ResetPasswordPage() {
  return (
    <div className={styles.authWrap}>
      <section className={styles.authCard}>
        <span className={styles.eyebrow}>Reset password</span>
        <h1>Create a new password</h1>
        <p>
          Enter the reset code and choose a new password for your seller or bidder account.
        </p>
        <ul className={styles.bulletList}>
          <li>This reset page is for sellers and bidders only.</li>
          <li>Admin credential recovery should stay on a private path.</li>
          <li>The current route is ready for token-based backend password reset later.</li>
        </ul>
      </section>

      <section className={styles.authCard}>
        <ResetPasswordForm />
      </section>
    </div>
  );
}
