"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import styles from "./BuyerShell.module.css";

const primaryNavItems = [
  { href: "/bidder", label: "Dashboard" },
  { href: "/bidder/auctions", label: "Auctions" },
  { href: "/bidder/my-bids", label: "My Bids" },
  { href: "/bidder/wins", label: "Wins" },
  { href: "/bidder/messages", label: "Messages" },
];

const accountMenuItems = [
  { href: "/bidder/notifications", label: "Notifications" },
  { href: "/bidder/profile", label: "Profile" },
];

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 17.5h14l-1.6-8.1-4.2 3.2L12 6.5 8.8 12.6 4.6 9.4 5 17.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M8.5 20h7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m7 10 5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function initialsForName(name) {
  return String(name || "B")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function BuyerShell({ children }) {
  const pathname = usePathname();
  const { user: profile } = useAuth();
  const imageUrl = profile?.profilePicture?.url;
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const handleLiveEvent = useCallback(
    (event) => {
      const payload = event?.payload || {};

      if (event?.event === "notification.created" && payload.notificationId) {
        const toast = {
          id: `${payload.notificationId}-${Date.now()}`,
          title: payload.title || "New notification",
          body: payload.body || "",
        };

        setToasts((current) => [toast, ...current].slice(0, 4));

        window.setTimeout(() => {
          setToasts((current) => current.filter((item) => item.id !== toast.id));
        }, 5000);
      }
    },
    [],
  );

  useLiveRefresh({
    channels: [profile?.id ? `user:${profile.id}` : "", "market:notifications"],
    enabled: Boolean(profile?.id),
    onEvent: handleLiveEvent,
  });

  const isAccountMenuActive = useMemo(
    () =>
      accountMenuItems.some(
        (item) => pathname === item.href || pathname?.startsWith(item.href),
      ),
    [pathname],
  );

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link href="/bidder" className={styles.brand}>
            <span className={styles.brandMark}>
              <CrownIcon />
            </span>
            <span className={styles.brandText}>AuctionArc</span>
          </Link>

          <nav className={styles.nav} aria-label="Buyer navigation">
            {primaryNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/bidder" && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive ? styles.navLinkActive : styles.navLink}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className={styles.profileGroup}>
            <NotificationBell notificationsHref="/bidder/notifications" />

            <div className={styles.menuWrap}>
              <button
                type="button"
                className={isAccountMenuActive || isAccountMenuOpen ? styles.avatarButtonActive : styles.avatarButton}
                onClick={() => setIsAccountMenuOpen((current) => !current)}
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
                aria-label="Open buyer account menu"
              >
                {imageUrl ? (
                  <span
                    className={styles.avatarPhoto}
                    style={{ backgroundImage: `url(${imageUrl})` }}
                    aria-label={`${profile?.name || "Buyer"} profile`}
                  />
                ) : (
                  <span className={styles.avatarFallback}>{initialsForName(profile?.name)}</span>
                )}
                <ChevronIcon />
              </button>

              {isAccountMenuOpen ? (
                <div className={styles.accountMenu} role="menu" aria-label="Buyer account menu">
                  {accountMenuItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/bidder" && pathname?.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={isActive ? styles.accountMenuItemActive : styles.accountMenuItem}
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    );
                  })}

                  <Link
                    href="/logout"
                    className={styles.accountMenuItem}
                    onClick={() => setIsAccountMenuOpen(false)}
                  >
                    Logout
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className={styles.content}>{children}</main>
      <div className={styles.toastFrame} aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={styles.toastCard}>
            <strong className={styles.toastTitle}>{toast.title}</strong>
            {toast.body ? <p className={styles.toastBody}>{toast.body}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
