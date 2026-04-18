"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/components/public/PublicPage.module.css";

export function RegisterForm() {
  const router = useRouter();
  const [birthdateError, setBirthdateError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [selectedImageName, setSelectedImageName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = new Date();
  const maxBirthdate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  )
    .toISOString()
    .split("T")[0];

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const birthdate = formData.get("birthdate");
    const role = formData.get("role");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");
    const birthdateValue = typeof birthdate === "string" ? birthdate : "";
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    setSubmitError("");
    setSubmitSuccess("");

    if (!birthdateValue) {
      setBirthdateError("Birthdate is required. Only users aged 18 or older can register.");
      return;
    }

    if (maxBirthdate && birthdateValue > maxBirthdate) {
      setBirthdateError("You must be at least 18 years old to create an AuctionArc account.");
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("Password and confirm password must match.");
      return;
    }

    setBirthdateError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.message || "Registration failed. Please try again.");
        return;
      }

      if (result.data?.token) {
        window.localStorage.setItem("auctionarc_token", result.data.token);
      }

      setSubmitSuccess("Account created successfully. Redirecting...");
      router.push(result.data?.destination || (role === "Seller" ? "/seller" : "/bidder"));
    } catch (error) {
      setSubmitError("Could not connect to the backend. Please make sure the backend server is running.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBirthdateChange(event) {
    if (maxBirthdate && event.target.value && event.target.value > maxBirthdate) {
      setBirthdateError("You must be at least 18 years old to create an AuctionArc account.");
      return;
    }

    setBirthdateError("");
  }

  function handleProfilePictureChange(event) {
    const file = event.target.files?.[0];
    setSelectedImageName(file ? file.name : "");
    setSubmitError("");
  }

  function handleFieldChange() {
    setSubmitError("");
    setSubmitSuccess("");
  }

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            name="name"
            type="text"
            placeholder="Enter your full name"
            required
            onChange={handleFieldChange}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="Enter your email"
            required
            onChange={handleFieldChange}
          />
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label htmlFor="register-role">Account role</label>
          <select id="register-role" name="role" defaultValue="Bidder" onChange={handleFieldChange}>
            <option>Seller</option>
            <option>Bidder</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="register-gender">Gender</label>
          <select
            id="register-gender"
            name="gender"
            defaultValue=""
            required
            onChange={handleFieldChange}
          >
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
          <input
            id="register-nid"
            name="nid"
            type="text"
            placeholder="Enter NID number"
            required
            onChange={handleFieldChange}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="register-birthdate">Birthdate</label>
          <input
            id="register-birthdate"
            name="birthdate"
            type="date"
            max={maxBirthdate}
            required
            onChange={handleBirthdateChange}
          />
          {birthdateError ? <p className={styles.errorText}>{birthdateError}</p> : null}
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label htmlFor="register-country">Country</label>
          <select
            id="register-country"
            name="country"
            defaultValue=""
            required
            onChange={handleFieldChange}
          >
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
          <input
            id="register-contact"
            name="contact"
            type="tel"
            placeholder="Enter phone number"
            required
            onChange={handleFieldChange}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="register-profile-picture">Profile picture</label>
        <input
          id="register-profile-picture"
          name="profilePicture"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleProfilePictureChange}
        />
        <p className={styles.helperText}>
          Upload a JPG, PNG, or WEBP image.
          {selectedImageName ? ` Selected file: ${selectedImageName}` : ""}
        </p>
      </div>

      <div className={styles.field}>
        <label htmlFor="register-wallet">Add wallet</label>
        <input
          id="register-wallet"
          name="wallet"
          type="text"
          placeholder="Enter wallet number or wallet ID"
          required
          onChange={handleFieldChange}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          name="password"
          type="password"
          placeholder="Create a strong password"
          required
          minLength={8}
          onChange={handleFieldChange}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="register-confirm-password">Confirm password</label>
        <input
          id="register-confirm-password"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          required
          minLength={8}
          onChange={handleFieldChange}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="register-human-verification">Human verification</label>
        <input
          id="register-human-verification"
          name="humanVerification"
          type="text"
          placeholder="Type: I am human"
          required
          onChange={handleFieldChange}
        />
      </div>

      {submitError ? <p className={styles.errorText}>{submitError}</p> : null}
      {submitSuccess ? <p className={styles.successText}>{submitSuccess}</p> : null}

      <div className={styles.buttonRow}>
        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>
        <Link href="/login" className={styles.secondaryButton}>
          Already have an account?
        </Link>
      </div>
      <p className={styles.helperText}>Admin registration remains private.</p>
    </form>
  );
}
