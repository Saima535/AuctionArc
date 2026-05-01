"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/components/public/PublicPage.module.css";
import { loginUser } from "@/lib/auth-actions";

export function AdminLoginForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    setSubmitError("");
    setSubmitSuccess("");

    setIsSubmitting(true);

    try {
      const result = await loginUser({
        email,
        password,
        role: "Admin",
      });

      setSubmitSuccess("Admin login successful. Redirecting...");
      router.push(result.destination);
    } catch (error) {
      setSubmitError(error.message || "Could not connect to the backend. Please make sure the backend server is running.");
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
        <label htmlFor="admin-login-email">Admin email</label>
        <input
          id="admin-login-email"
          name="email"
          type="email"
          placeholder="Enter your admin email"
          required
          onChange={handleFieldChange}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="admin-login-password">Password</label>
        <input
          id="admin-login-password"
          name="password"
          type="password"
          placeholder="Enter your password"
          required
          onChange={handleFieldChange}
        />
      </div>

      {submitError ? <p className={styles.errorText}>{submitError}</p> : null}
      {submitSuccess ? <p className={styles.successText}>{submitSuccess}</p> : null}

      <div className={styles.buttonRow}>
        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? "Signing In..." : "Admin Sign In"}
        </button>
        <Link href="/login" className={styles.secondaryButton}>
          Public Login
        </Link>
      </div>

      <p className={styles.helperText}>
        This route is reserved for platform administrators. Admin password recovery should remain private.
      </p>
    </form>
  );
}
