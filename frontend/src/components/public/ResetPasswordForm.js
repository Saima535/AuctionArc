"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/components/public/PublicPage.module.css";
import { apiRequest } from "@/lib/api";

export function ResetPasswordForm() {
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
      await apiRequest("/auth/reset-password", {
        method: "POST",
        auth: false,
        body: {
          code: formData.get("code"),
          password: formData.get("password"),
          confirmPassword: formData.get("confirmPassword"),
        },
      });

      setSubmitSuccess("Password reset completed successfully. Redirecting...");
      router.push("/login");
    } catch (error) {
      setSubmitError(error.message || "Could not reset password.");
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
        <label htmlFor="reset-code">Reset code</label>
        <input id="reset-code" name="code" type="text" placeholder="Enter reset code" required onChange={handleFieldChange} />
      </div>
      <div className={styles.field}>
        <label htmlFor="reset-password">New password</label>
        <input id="reset-password" name="password" type="password" placeholder="Enter new password" required onChange={handleFieldChange} />
      </div>
      <div className={styles.field}>
        <label htmlFor="reset-confirm-password">Confirm new password</label>
        <input
          id="reset-confirm-password"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter new password"
          required
          onChange={handleFieldChange}
        />
      </div>
      {submitError ? <p className={styles.errorText}>{submitError}</p> : null}
      {submitSuccess ? <p className={styles.successText}>{submitSuccess}</p> : null}
      <div className={styles.buttonRow}>
        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </button>
        <Link href="/login" className={styles.secondaryButton}>
          Back to login
        </Link>
      </div>
      <p className={styles.helperText}>Enter the reset code you received and choose a new password.</p>
    </form>
  );
}
