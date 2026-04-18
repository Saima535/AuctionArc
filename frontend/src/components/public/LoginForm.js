"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/components/public/PublicPage.module.css";
import { getApiBaseUrl, storeToken } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const role = formData.get("role");
    const email = formData.get("email");
    const password = formData.get("password");
    const apiBaseUrl = getApiBaseUrl();

    setSubmitError("");
    setSubmitSuccess("");

    if (!apiBaseUrl) {
      setSubmitError("Frontend configuration is missing NEXT_PUBLIC_API_BASE_URL.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.message || "Login failed. Please try again.");
        return;
      }

      if (result.data?.token) {
        storeToken(result.data.token);
      }

      setSubmitSuccess("Login successful. Redirecting...");
      router.push(result.data?.destination || "/login");
    } catch (error) {
      setSubmitError("Could not connect to the backend. Please make sure the backend server is running.");
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
        <label htmlFor="login-role">Sign in as</label>
        <select id="login-role" name="role" defaultValue="Bidder" onChange={handleFieldChange}>
          <option>Bidder</option>
          <option>Seller</option>
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          name="email"
          type="email"
          placeholder="Enter your email"
          required
          onChange={handleFieldChange}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
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
          {isSubmitting ? "Signing In..." : "SIGN IN"}
        </button>
        <Link href="/register" className={styles.secondaryButton}>
          Create Account
        </Link>
        <Link href="/forgot-password" className={styles.secondaryButton}>
          Forgot Password
        </Link>
      </div>
      <p className={styles.helperText}>Use your buyer or seller account to continue.</p>
    </form>
  );
}
