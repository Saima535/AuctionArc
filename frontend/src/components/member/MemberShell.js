"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./MemberShell.module.css";

function getActiveLabel(pathname, navItems) {
  const current = navItems.find(
    (item) => pathname === item.href || (item.href !== basePath(pathname) && pathname?.startsWith(item.href)),
  );

  return current?.label || titleFromPath(pathname);
}

function titleFromPath(pathname) {
  if (!pathname) {
    return "Dashboard";
  }

  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "dashboard";

  return last
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function basePath(pathname) {
  return pathname ? `/${pathname.split("/").filter(Boolean)[0]}` : "";
}

export function MemberShell({
  children,
  role,
  navItems,
  badge,
  homeHref,
  eyebrow,
}) {
  const pathname = usePathname();
  const pageTitle = getActiveLabel(pathname, navItems);

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <Link href={homeHref} className={styles.brand}>
            <span className={styles.brandMark}>AA</span>
            <span>
              <strong>AuctionArc</strong>
              <small>{badge}</small>
            </span>
          </Link>
        </div>

        <nav className={styles.nav} aria-label={`${role} navigation`}>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== homeHref && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? styles.navItemActive : styles.navItem}
              >
                <span>{item.label}</span>
                <small>{item.caption}</small>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1>{pageTitle}</h1>
          </div>

          <div className={styles.topbarActions}>
            <button type="button" className={styles.utilityButton}>
              Notifications
            </button>
            <button type="button" className={styles.utilityButton}>
              Quick Action
            </button>
            <Link href="/logout" className={styles.signoutButton}>
              Sign out
            </Link>
            <div className={styles.profilePill}>
              <span>{role.slice(0, 1)}</span>
              <div>
                <strong>{role}</strong>
                <small>{badge}</small>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
