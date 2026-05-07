"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useApiData } from "@/hooks/useApiData";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { apiRequest } from "@/lib/api";
import styles from "./NotificationCenter.module.css";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.5 16.5V11a5.5 5.5 0 1 1 11 0v5.5l1.5 2H5l1.5-2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10 20a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

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

export function NotificationBell({ notificationsHref }) {
  const router = useRouter();
  const wrapRef = useRef(null);
  const lastLiveRefreshAtRef = useRef(0);
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const liveChannels = user?.id ? [`user:${user.id}`, "market:notifications"] : [];
  const { data, setData, refresh, isRefreshing } = useApiData("/notifications?limit=10&unreadFirst=true", {
    initialData: { items: [], unreadCount: 0 },
    refreshIntervalMs: 0,
    revalidateOnWindowFocus: false,
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
    channels: liveChannels,
    enabled: Boolean(user?.id),
    onEvent: handleLiveEvent,
  });

  useEffect(() => {
    function handlePointerDown(event) {
      if (!wrapRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    refresh({ background: true });
  }, [isOpen, refresh]);

  async function handleOpenNotification(notification) {
    if (!notification.isRead) {
      try {
        const result = await apiRequest(`/notifications/${notification.id}/read`, {
          method: "PATCH",
        });

        setData((current) => ({
          ...current,
          unreadCount: Math.max((current?.unreadCount || 0) - 1, 0),
          items: (current?.items || []).map((item) =>
            item.id === notification.id ? result.data : item,
          ),
        }));
      } catch {
        // Keep navigation responsive even if the read update fails.
      }
    }

    setIsOpen(false);

    if (notification.href) {
      router.push(notification.href);
    }
  }

  const items = data?.items || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className={styles.bellWrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.bellButton}
        aria-label="Notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <BellIcon />
        {unreadCount ? (
          <span className={styles.countBadge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        ) : null}
      </button>

      {isOpen ? (
        <div className={styles.menu}>
          <div className={styles.menuHeader}>
            <div>
              <h3>Notifications</h3>
              <p>{unreadCount ? `${unreadCount} unread` : "No unread notifications"}</p>
            </div>
            <span className={styles.pill}>{isRefreshing ? "Refreshing..." : "Latest 10"}</span>
          </div>

          <div className={styles.menuBody}>
            {!items.length ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>No notifications yet for this account.</p>
              </div>
            ) : null}

            {items.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className={notification.isRead ? styles.item : styles.itemUnread}
                onClick={() => handleOpenNotification(notification)}
              >
                <div className={styles.itemTop}>
                  <span className={styles.itemTitle}>{notification.title}</span>
                  <span className={notification.isRead ? styles.pillRead : styles.pillUnread}>
                    {notification.isRead ? "Read" : "Unread"}
                  </span>
                </div>
                <div className={styles.itemBody}>{notification.body}</div>
                <div className={styles.itemMeta}>
                  <span>{notification.type}</span>
                  <span>{formatStamp(notification.createdAt)}</span>
                </div>
              </button>
            ))}
          </div>

          <div className={styles.menuFooter}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={async () => {
                await apiRequest("/notifications/read-all", { method: "PATCH" });
                refresh({ background: true });
              }}
            >
              Mark all read
            </button>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                setIsOpen(false);
                router.push(notificationsHref);
              }}
            >
              See all
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
