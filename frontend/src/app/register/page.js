import Link from "next/link";
import styles from "@/components/public/PublicPage.module.css";

export const metadata = {
  title: "Register | AuctionArc",
  description: "Create a seller, bidder, or admin-facing AuctionArc account.",
};

export default function RegisterPage() {
  return (
    <div className={styles.authWrap}>
      <section className={styles.authCard}>
        <span className={styles.eyebrow}>Create account</span>
        <h1>Register for AuctionArc</h1>
        <p>
          Choose the role that best matches your work in the platform. This
          frontend form gives us the structure for later backend integration.
        </p>
        <ul className={styles.bulletList}>
          <li>Seller accounts will manage auction listings and inventory.</li>
          <li>Bidder accounts will follow listings and place bids.</li>
          <li>Admin accounts will oversee platform activity and controls.</li>
        </ul>
      </section>

      <section className={styles.authCard}>
        <form className={styles.authForm}>
          <div className={styles.field}>
            <label htmlFor="register-name">Full name</label>
            <input id="register-name" name="name" type="text" placeholder="Enter your full name" />
          </div>
          <div className={styles.field}>
            <label htmlFor="register-email">Email address</label>
            <input id="register-email" name="email" type="email" placeholder="Enter your email" />
          </div>
          <div className={styles.field}>
            <label htmlFor="register-role">Account role</label>
            <select id="register-role" name="role" defaultValue="Bidder">
              <option>Seller</option>
              <option>Bidder</option>
              <option>Admin</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              name="password"
              type="password"
              placeholder="Create a strong password"
            />
          </div>
          <div className={styles.buttonRow}>
            <button type="submit" className={styles.submitButton}>
              Create Account
            </button>
            <Link href="/login" className={styles.secondaryButton}>
              Already have an account?
            </Link>
          </div>
          <p className={styles.helperText}>
            This is a frontend-only form for now. Submission handling will come
            when we build the backend.
          </p>
        </form>
      </section>
    </div>
  );
}
