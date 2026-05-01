"use client";

import styles from "./ApiFeedback.module.css";

function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(" ");
}

export function ApiLoadingNotice({ title = "Loading", message = "We are fetching the latest data.", className = "" }) {
  return (
    <div className={joinClassNames(styles.panel, styles.loading, className)}>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

export function ApiErrorNotice({ title = "Something went wrong", message, className = "" }) {
  if (!message) {
    return null;
  }

  return (
    <div className={joinClassNames(styles.panel, styles.error, className)} role="alert">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

export function ApiEmptyState({ title = "Nothing to show yet", message = "This section will populate once data is available.", className = "" }) {
  return (
    <div className={joinClassNames(styles.panel, styles.empty, className)}>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
