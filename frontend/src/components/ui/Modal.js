"use client";

import React from "react";
import styles from "./Modal.module.css";

export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3>{title}</h3>
          <button aria-label="Close" className={styles.close} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
