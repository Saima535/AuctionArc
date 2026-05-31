"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import styles from "./AdminShell.module.css";
import { adminNavItems } from "@/data/admin/navigation";

const navGroups = [
  {
    title: "Overview",
    hrefs: ["/admin"],
  },
  {
    title: "Marketplace",
    hrefs: ["/admin/users", "/admin/products", "/admin/bids", "/admin/winners", "/admin/transactions", "/admin/feedback"],
  },
  {
    title: "Operations",
    hrefs: ["/admin/chats", "/admin/reports", "/admin/notifications"],
  },
];

function getActiveNavItem(pathname) {
  return (
    adminNavItems.find(
      (item) => pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href)),
    ) || null
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <rect x="14" y="4" width="6" height="6" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <rect x="4" y="14" width="6" height="6" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <rect x="14" y="14" width="6" height="6" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 16 6-6 4 4 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7h5v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16.5 19a4.5 4.5 0 0 0-9 0M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 18v-.8A3.2 3.2 0 0 0 16 14M17 10a2.7 2.7 0 1 0 0-5.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 7 4v10l-7 4-7-4V7l7-4Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m5 7 7 4 7-4M12 11v10" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v18M16 7.5c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.5 2.6 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 6.5h14v8H9l-4 3v-11Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 21 19a1.2 1.2 0 0 1-1 1.8H4a1.2 1.2 0 0 1-1-1.8L12 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 9v4.5M12 17.3h.01" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 16.5h11l-1.2-2V10a4.3 4.3 0 1 0-8.6 0v4.5l-1.2 2Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3.8 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 17l-5.2 2.8 1-5.8-4.2-4.1 5.8-.8L12 3.8Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function iconForHref(href) {
  if (href === "/admin") return <GridIcon />;
  if (href === "/admin/users") return <UsersIcon />;
  if (href === "/admin/products") return <BoxIcon />;
  if (href === "/admin/bids") return <TrendIcon />;
  if (href === "/admin/transactions") return <DollarIcon />;
  if (href === "/admin/winners") return <DollarIcon />;
  if (href === "/admin/feedback") return <StarIcon />;
  if (href === "/admin/chats") return <MessageIcon />;
  if (href === "/admin/reports") return <AlertIcon />;
  if (href === "/admin/notifications") return <BellIcon />;
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

export function AdminShell({ children }) {
  const pathname = usePathname();
  const activeItem = getActiveNavItem(pathname);
  const title = activeItem?.label || "Admin";
  const description = activeItem?.caption || "Marketplace administration";
  const { user: profile } = useAuth();
  const imageUrl = profile?.profilePicture?.url || "";
  const groupedNavigation = useMemo(
    () =>
      navGroups.map((group) => ({
        ...group,
        items: adminNavItems.filter((item) => group.hrefs.includes(item.href)),
      })),
    [],
  );

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <div className={styles.brandPanel}>
          <Link href="/admin" className={styles.brand}>
            <span className={styles.brandMark}>AA</span>
            <span>
              <strong>AuctionArc</strong>
              <small>Super Admin Console</small>
            </span>
          </Link>
        </div>

        <div className={styles.navGroups}>
          {groupedNavigation.map((group) => (
            <section key={group.title} className={styles.navGroup}>
              <p className={styles.navGroupTitle}>{group.title}</p>
              <nav className={styles.nav} aria-label={`${group.title} navigation`}>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname?.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={isActive ? styles.navItemActive : styles.navItem}
                    >
                      <span className={styles.navIcon}>{iconForHref(item.href)}</span>
                      <span className={styles.navMeta}>
                        <strong>{item.label}</strong>
                        <small>{item.caption}</small>
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </section>
          ))}
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.profileCard}>
            {imageUrl ? (
              <span
                className={styles.profilePhoto}
                style={{ backgroundImage: `url(${imageUrl})` }}
                aria-label={`${profile?.name || "Admin"} profile`}
              />
            ) : (
              <span className={styles.profileFallback}>{initialsForName(profile?.name)}</span>
            )}
            <span className={styles.profileMeta}>
              <strong>{profile?.name || "Super Admin"}</strong>
              <small>{profile?.publicRoleLabel || profile?.role || "Administrator"}</small>
            </span>
          </div>

          <Link href="/logout" className={styles.signoutButton}>
            Sign out
          </Link>
        </div>
      </aside>

      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <div className={styles.headingBlock}>
            <p className={styles.eyebrow}>Admin workspace</p>
            <h1>{title}</h1>
            <p className={styles.pageCopy}>{description}</p>
          </div>

        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
