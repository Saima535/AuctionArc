"use client";

import styles from "./MessageItem.module.css";

export default function MessageItem({ message, isOwn }) {
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`${styles.container} ${isOwn ? styles.own : styles.other}`}>
      <div className={styles.message}>
        <div className={styles.bubble}>
          <p>{message.text}</p>
          {message.isEdited && <span className={styles.edited}>(edited)</span>}
        </div>
        <span className={styles.time}>{formatTime(message.createdAt)}</span>
        {isOwn && message.isRead && <span className={styles.readReceipt}>✓✓</span>}
      </div>
    </div>
  );
}
