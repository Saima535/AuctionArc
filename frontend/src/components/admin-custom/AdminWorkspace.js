"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminWorkspace.module.css";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/transactions", label: "Transactions", icon: "money" },
  { href: "/admin/disputes", label: "Disputes", icon: "alert" },
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

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 16.5V11a5.5 5.5 0 1 1 11 0v5.5l1.5 2H5l1.5-2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

export function AdminWorkspace({ children }) {
  const pathname = usePathname();

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
          {navItems.map((item) => {
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
          <h1>Admin Dashboard</h1>

          <div className={styles.topbarActions}>
            <button type="button" className={styles.notificationButton} aria-label="Notifications">
              <BellIcon />
              <span className={styles.notificationDot} />
            </button>

            <Link href="/logout" className={styles.logoutButton}>
              Logout
            </Link>

            <Link href="/admin/profile" className={styles.profileCard}>
              <span className={styles.profileIcon}>
                <UserBadgeIcon />
              </span>
              <span>
                <strong>Admin</strong>
                <small>Administrator</small>
              </span>
            </Link>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
