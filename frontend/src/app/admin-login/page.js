import styles from "@/components/public/PublicPage.module.css";
import { AdminLoginForm } from "@/components/public/AdminLoginForm";

export const metadata = {
  title: "Admin Login | AuctionArc",
  description: "Private administrator sign-in for AuctionArc.",
};

export default function AdminLoginPage() {
  return (
    <div className={styles.authWrap}>
      <section className={styles.authCard}>
        <span className={styles.eyebrow}>Private Access</span>
        <h1>Admin Sign In</h1>
        <p>
          Use this dedicated route to access the AuctionArc administrator workspace
          for moderation, transaction oversight, disputes, and platform controls.
        </p>
        <ul className={styles.bulletList}>
          <li>This page accepts administrator credentials only.</li>
          <li>Buyer and seller accounts should continue using the public sign-in page.</li>
          <li>Admin credentials are provisioned from the backend environment configuration.</li>
        </ul>
      </section>

      <section className={styles.authCard}>
        <AdminLoginForm />
      </section>
    </div>
  );
}
