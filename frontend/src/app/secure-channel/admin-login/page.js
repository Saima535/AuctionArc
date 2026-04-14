import Link from "next/link";
import styles from "@/components/public/PublicPage.module.css";

export const metadata = {
  title: "Admin Login | AuctionArc",
  description: "Dedicated admin sign-in entry for AuctionArc management access.",
};

export default function AdminLoginPage() {
  return (
    <div className={styles.authWrap}>
      <section className={styles.authCard}>
        <span className={styles.eyebrow}>Restricted access</span>
        <h1>Admin login</h1>
        <p>
          This route is reserved for administrators and is intentionally kept
          outside the public navigation flow.
        </p>
        <ul className={styles.bulletList}>
          <li>Admins do not register through the public site.</li>
          <li>Administrator credentials should be provisioned privately.</li>
          <li>This page is the frontend placeholder for the secure admin channel.</li>
        </ul>
      </section>

      <section className={styles.authCard}>
        <form className={styles.authForm}>
          <div className={styles.field}>
            <label htmlFor="admin-email">Admin email</label>
            <input id="admin-email" name="email" type="email" placeholder="Enter admin email" />
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-password">Password</label>
            <input id="admin-password" name="password" type="password" placeholder="Enter password" />
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-code">Security code</label>
            <input
              id="admin-code"
              name="security-code"
              type="password"
              placeholder="Enter additional verification code"
            />
          </div>
          <div className={styles.buttonRow}>
            <button type="submit" className={styles.submitButton}>
              Enter Admin Portal
            </button>
            <Link href="/" className={styles.secondaryButton}>
              Back to homepage
            </Link>
          </div>
          <p className={styles.helperText}>
            Frontend note: this route is separated, but real security will come
            from backend authorization, protected delivery, and server-side checks.
          </p>
        </form>
      </section>
    </div>
  );
}
