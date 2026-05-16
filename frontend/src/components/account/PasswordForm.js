"use client";

import { useState } from "react";
import styles from "./AccountForms.module.css";
import { apiRequest } from "@/lib/api";

export default function PasswordForm({ onSaved }) {
  const [values, setValues] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((s) => ({ ...s, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (values.newPassword !== values.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/users/me/password", { method: "PATCH", body: { currentPassword: values.currentPassword, newPassword: values.newPassword } });
      setMessage("Password updated.");
      setValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
      onSaved?.();
    } catch (err) {
      setError(err.message || "Could not update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label htmlFor="currentPassword">Current password</label>
          <input id="currentPassword" name="currentPassword" type="password" value={values.currentPassword} onChange={handleChange} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="newPassword">New password</label>
          <input id="newPassword" name="newPassword" type="password" value={values.newPassword} onChange={handleChange} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="confirmPassword">Confirm new password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" value={values.confirmPassword} onChange={handleChange} required />
        </div>
      </div>
      <div className={styles.actions}>
        <button type="submit" className={styles.primary} disabled={loading}>{loading ? "Saving..." : "Change password"}</button>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.success}>{message}</p> : null}
    </form>
  );
}
