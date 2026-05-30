"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import styles from "./AdminWorkspace.module.css";

const sidebarItems = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/products", label: "Products", icon: "grid" },
  { href: "/admin/auctions", label: "Auctions", icon: "grid" },
  { href: "/admin/bids", label: "Bids", icon: "money" },
  { href: "/admin/chats", label: "Chats", icon: "alert" },
  { href: "/admin/reports", label: "Reports", icon: "alert" },
  { href: "/admin/transactions", label: "Transactions", icon: "money" },
  { href: "/admin/winners", label: "Winners", icon: "users" },
  { href: "/admin/notifications", label: "Notifications", icon: "alert" },
  { href: "/admin/profile", label: "Profile", icon: "users" },
];

const primaryTopNavItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/auctions", label: "Auctions" },
  { href: "/admin/chats", label: "Chats" },
  { href: "/admin/reports", label: "Reports" },
];

const accountMenuItems = [
  { href: "/admin/bids", label: "Bids" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/winners", label: "Winners" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/profile", label: "Profile" },
];

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="4" width="6" height="6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="14" width="6" height="6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="14" width="6" height="6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16.5 19a4.5 4.5 0 0 0-9 0M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 18v-.8A3.2 3.2 0 0 0 16 14M17 10a2.7 2.7 0 1 0 0-5.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6.5h16v11H4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 9v5M9.5 11.5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6.5 9.5h.01M17.5 13.5h.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 4.5h10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 21 19a1.2 1.2 0 0 1-1 1.8H4a1.2 1.2 0 0 1-1-1.8L12 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 9v4.5M12 17.3h.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UserBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6.5 18a5.5 5.5 0 0 1 11 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function SidebarIcon({ icon }) {
  if (icon === "users") {
    return <UsersIcon />;
  }

  if (icon === "money") {
    return <MoneyIcon />;
  }

  if (icon === "alert") {
    return <AlertIcon />;
  }

  return <GridIcon />;
}

function initialsForName(name) {
  return String(name || "Admin")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AdminWorkspace({ children }) {
  const pathname = usePathname();
  const { user: profile } = useAuth();
  const imageUrl = profile?.profilePicture?.url;
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const isAccountMenuActive = useMemo(
    () =>
      accountMenuItems.some(
        (item) => pathname === item.href || pathname?.startsWith(item.href),
      ),
    [pathname],
  );

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <Link href="/admin" className={styles.brand}>
            <span>
              Auction<span className={styles.brandAccent}>Arc</span>
            </span>
          </Link>
          <p>Admin Dashboard</p>
        </div>

        <nav className={styles.nav} aria-label="Admin navigation">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname?.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href} className={isActive ? styles.navItemActive : styles.navItem}>
                <SidebarIcon icon={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>© 2024 AuctionArc</div>
      </aside>

        <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <div className={styles.topbarMain}>
            <h1>Admin workspace</h1>
            <nav className={styles.topnav} aria-label="Admin top navigation">
              {primaryTopNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={isActive ? styles.topnavLinkActive : styles.topnavLink}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className={styles.topbarActions}>
            <NotificationBell notificationsHref="/admin/notifications" />

            <div className={styles.menuWrap}>
              <button
                type="button"
                className={isAccountMenuActive || isAccountMenuOpen ? styles.profileButtonActive : styles.profileButton}
                onClick={() => setIsAccountMenuOpen((current) => !current)}
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
                aria-label="Open admin account menu"
              >
                <span className={styles.profileIcon}>
                  {imageUrl ? (
                    <span
                      className={styles.profileImage}
                      style={{ backgroundImage: `url(${imageUrl})` }}
                      aria-label={`${profile?.name || "Admin"} profile`}
                    />
                  ) : (
                    initialsForName(profile?.name) || <UserBadgeIcon />
                  )}
                </span>
                <span className={styles.profileSummary}>
                  <strong>{profile?.name || "Admin"}</strong>
                  <small>{profile?.publicRoleLabel || profile?.role || "Administrator"}</small>
                </span>
                <ChevronIcon />
              </button>

              {isAccountMenuOpen ? (
                <div className={styles.accountMenu} role="menu" aria-label="Admin account menu">
                  {accountMenuItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/admin" && pathname?.startsWith(item.href));

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
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
