import Link from "next/link";
import styles from "@/components/public/PublicPage.module.css";

export const metadata = {
  title: "Logout | AuctionArc",
  description: "Sign out flow placeholder for AuctionArc.",
};

export default function LogoutPage() {
  return (
    <div className={styles.logoutWrap}>
      <section className={styles.logoutCard}>
        <span className={styles.eyebrow}>Session</span>
        <h1>Logout page ready for session handling</h1>
        <p>
          This route is prepared for the future sign-out flow. Once backend
          authentication is in place, we can clear tokens, redirect users, and
          confirm logout state here.
        </p>
        <div className={styles.buttonRow}>
          <Link href="/login" className={styles.submitButton}>
            Return to login
          </Link>
          <Link href="/" className={styles.secondaryButton}>
            Back to homepage
          </Link>
        </div>
      </section>
    </div>
  );
}
