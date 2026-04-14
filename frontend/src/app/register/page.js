import Link from "next/link";
import styles from "@/components/public/PublicPage.module.css";

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
          Public registration is available for sellers and bidders. This
          frontend form gives us the structure for later backend integration.
        </p>
        <ul className={styles.bulletList}>
          <li>Seller accounts will manage auction listings and inventory.</li>
          <li>Bidder accounts will follow listings and place bids.</li>
          <li>Admin accounts are provisioned separately through a private channel.</li>
        </ul>
      </section>

      <section className={styles.authCard}>
        <form className={styles.authForm}>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label htmlFor="register-name">Full name</label>
              <input id="register-name" name="name" type="text" placeholder="Enter your full name" />
            </div>
            <div className={styles.field}>
              <label htmlFor="register-email">Email address</label>
              <input id="register-email" name="email" type="email" placeholder="Enter your email" />
            </div>
          </div>

          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label htmlFor="register-role">Account role</label>
              <select id="register-role" name="role" defaultValue="Bidder">
                <option>Seller</option>
                <option>Bidder</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="register-gender">Gender</label>
              <select id="register-gender" name="gender" defaultValue="">
                <option value="" disabled>
                  Select gender
                </option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label htmlFor="register-nid">NID</label>
              <input id="register-nid" name="nid" type="text" placeholder="Enter NID number" />
            </div>
            <div className={styles.field}>
              <label htmlFor="register-birthdate">Birthdate</label>
              <input id="register-birthdate" name="birthdate" type="date" />
            </div>
          </div>

          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label htmlFor="register-country">Country</label>
              <select id="register-country" name="country" defaultValue="">
                <option value="" disabled>
                  Select country
                </option>
                <option>Bangladesh</option>
                <option>India</option>
                <option>Pakistan</option>
                <option>Nepal</option>
                <option>Sri Lanka</option>
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Canada</option>
                <option>Australia</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="register-contact">Contact</label>
              <input id="register-contact" name="contact" type="tel" placeholder="Enter phone number" />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="register-wallet">Add wallet</label>
            <input
              id="register-wallet"
              name="wallet"
              type="text"
              placeholder="Enter wallet number or wallet ID"
            />
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

          <div className={styles.field}>
            <label htmlFor="register-confirm-password">Confirm password</label>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="register-human-verification">Human verification</label>
            <input
              id="register-human-verification"
              name="humanVerification"
              type="text"
              placeholder="Type: I am human"
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
            This is a frontend-only form for now. Validation, secure identity
            checks, and real verification handling will come with the backend.
          </p>
        </form>
      </section>
    </div>
  );
}
