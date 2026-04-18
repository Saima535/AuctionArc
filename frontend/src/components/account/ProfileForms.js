"use client";

import { useState } from "react";
import styles from "./AccountForms.module.css";

export function ProfileEditor({
  title,
  description,
  fields,
  onSubmit,
  submitLabel = "Save Changes",
  isSubmitting = false,
  submitMessage = "",
  submitError = "",
  helper = "Profile values will update here after live account data is connected.",
}) {
  const [formValues, setFormValues] = useState(() =>
    Object.fromEntries(fields.map((field) => [field.name, field.defaultValue || ""])),
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (onSubmit) {
      onSubmit(formValues);
    }
  }

  return (
    <section className={styles.formCard}>
      <div className={styles.header}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldGrid}>
          {fields.map((field) => {
            if (field.type === "select") {
              return (
                <div key={field.name} className={styles.field}>
                  <label htmlFor={field.name}>{field.label}</label>
                  <select id={field.name} name={field.name} value={formValues[field.name] || ""} onChange={handleChange}>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            if (field.type === "textarea") {
              return (
                <div key={field.name} className={styles.field}>
                  <label htmlFor={field.name}>{field.label}</label>
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={formValues[field.name] || ""}
                    onChange={handleChange}
                  />
                </div>
              );
            }

            return (
              <div key={field.name} className={styles.field}>
                <label htmlFor={field.name}>{field.label}</label>
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type || "text"}
                  value={formValues[field.name] || ""}
                  onChange={handleChange}
                />
              </div>
            );
          })}
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
          <button type="reset" className={styles.secondary} onClick={() => setFormValues(Object.fromEntries(fields.map((field) => [field.name, field.defaultValue || ""])))}>
            Cancel
          </button>
        </div>
        {submitError ? <p className={styles.error}>{submitError}</p> : null}
        {submitMessage ? <p className={styles.success}>{submitMessage}</p> : null}
        <p className={styles.helper}>{helper}</p>
      </form>
    </section>
  );
}

export function SettingsEditor({
  title,
  description,
  fields,
  onSubmit,
  submitLabel = "Update Settings",
  isSubmitting = false,
  submitMessage = "",
  submitError = "",
  helper = "Settings will appear here when your live account data is available.",
}) {
  const [formValues, setFormValues] = useState(() =>
    Object.fromEntries(fields.map((field) => [field.name, field.defaultValue || ""])),
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (onSubmit) {
      onSubmit(formValues);
    }
  }

  return (
    <section className={styles.formCard}>
      <div className={styles.header}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {fields.map((field) => {
          if (field.type === "select") {
            return (
              <div key={field.name} className={styles.field}>
                <label htmlFor={field.name}>{field.label}</label>
                <select id={field.name} name={field.name} value={formValues[field.name] || ""} onChange={handleChange}>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          return (
            <div key={field.name} className={styles.field}>
              <label htmlFor={field.name}>{field.label}</label>
              <input
                id={field.name}
                name={field.name}
                type={field.type || "text"}
                value={formValues[field.name] || ""}
                onChange={handleChange}
              />
            </div>
          );
        })}

        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : submitLabel}
          </button>
        </div>
        {submitError ? <p className={styles.error}>{submitError}</p> : null}
        {submitMessage ? <p className={styles.success}>{submitMessage}</p> : null}
        <p className={styles.helper}>{helper}</p>
      </form>
    </section>
  );
}
