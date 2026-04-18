"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/components/public/PublicPage.module.css";
import { apiRequest } from "@/lib/api";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setSubmitError("");
    setSubmitSuccess("");
    setIsSubmitting(true);

    try {
      const result = await apiRequest("/auth/forgot-password", {
        method: "POST",
        auth: false,
        body: {
          email: formData.get("email"),
          role: formData.get("role"),
        },
      });

      const resetCode = result.data?.developmentCode;
      setSubmitSuccess(
        resetCode
          ? `Reset code generated successfully. Development code: ${resetCode}`
          : "Reset instructions generated successfully.",
      );
      router.push("/reset-password");
    } catch (error) {
      setSubmitError(error.message || "Could not request password reset.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFieldChange() {
    setSubmitError("");
    setSubmitSuccess("");
  }

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="forgot-email">Email address</label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          placeholder="Enter your registered email"
          required
          onChange={handleFieldChange}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="forgot-role">Account role</label>
        <select id="forgot-role" name="role" defaultValue="Bidder" onChange={handleFieldChange}>
          <option>Seller</option>
          <option>Bidder</option>
        </select>
      </div>
      {submitError ? <p className={styles.errorText}>{submitError}</p> : null}
      {submitSuccess ? <p className={styles.successText}>{submitSuccess}</p> : null}
      <div className={styles.buttonRow}>
        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Reset Code"}
        </button>
        <Link href="/login" className={styles.secondaryButton}>
          Back to login
        </Link>
      </div>
      <p className={styles.helperText}>Use the same role that was selected when the account was created.</p>
    </form>
  );
}
