"use client";

import { useCallback, useRef } from "react";
import { ApiEmptyState, ApiErrorNotice } from "@/components/feedback/ApiFeedback";
import { useApiData } from "@/hooks/useApiData";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiRequest } from "@/lib/api";
import styles from "./NotificationCenter.module.css";

function formatStamp(value) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function NotificationsPage({ title, description }) {
  const { user } = useAuth();
  const lastLiveRefreshAtRef = useRef(0);
  const { data, setData, error, isRefreshing, refresh } = useApiData("/notifications", {
    initialData: { items: [], unreadCount: 0 },
    refreshIntervalMs: 60000,
    revalidateOnWindowFocus: true,
    enabled: Boolean(user?.id),
  });

  const handleLiveEvent = useCallback(() => {
    const now = Date.now();

    if (now - lastLiveRefreshAtRef.current < 2000) {
      return;
    }

    lastLiveRefreshAtRef.current = now;
    refresh({ background: true });
  }, [refresh]);

  useLiveRefresh({
    channels: user?.id ? [`user:${user.id}`, "market:notifications"] : [],
    enabled: Boolean(user?.id),
    onEvent: handleLiveEvent,
  });

  const items = data?.items || [];

  async function handleMarkRead(notificationId) {
    const result = await apiRequest(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    });

    setData((current) => ({
      ...current,
      unreadCount: Math.max((current?.unreadCount || 0) - 1, 0),
      items: (current?.items || []).map((item) =>
        item.id === notificationId ? result.data : item,
      ),
    }));
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className={styles.pageItemActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => refresh({ background: true })}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            className={styles.pageButton}
            onClick={async () => {
              await apiRequest("/notifications/read-all", { method: "PATCH" });
              refresh({ background: true });
            }}
          >
            Mark all read
          </button>
        </div>
      </header>

      {error ? <ApiErrorNotice title="Notifications unavailable" message={error} /> : null}

      <section className={styles.pageSection}>
        {!items.length ? (
          <ApiEmptyState
            title="No notifications yet"
            message="User-specific notifications will appear here as marketplace activity happens."
          />
        ) : null}

        <div className={styles.pageList}>
          {items.map((notification) => (
            <article
              key={notification.id}
              className={notification.isRead ? styles.pageItem : styles.pageItemUnread}
            >
              <div className={styles.pageItemHeader}>
                <div>
                  <h3>{notification.title}</h3>
                  <p className={styles.itemBody}>{notification.body}</p>
                </div>
                <span className={notification.isRead ? styles.pillRead : styles.pillUnread}>
                  {notification.isRead ? "Read" : "Unread"}
                </span>
              </div>

              <div className={styles.itemMeta}>
                <span>{notification.type}</span>
                <span>{formatStamp(notification.createdAt)}</span>
              </div>

              <div className={styles.pageItemActions}>
                {!notification.isRead ? (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => handleMarkRead(notification.id)}
                  >
                    Mark as read
                  </button>
                ) : null}
                {notification.href ? (
                  <a className={styles.pageButton} href={notification.href}>
                    Open
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
