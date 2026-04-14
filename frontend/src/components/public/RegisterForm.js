"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/components/public/PublicPage.module.css";

export function RegisterForm() {
  const router = useRouter();

  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const role = formData.get("role");
    const destination = role === "Seller" ? "/seller" : "/bidder";

    router.push(destination);
  }

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
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
        Frontend flow: sellers are redirected to `/seller` and bidders are
        redirected to `/bidder` after signup. Admin registration remains private.
      </p>
    </form>
  );
}
