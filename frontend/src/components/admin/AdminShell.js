"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminShell.module.css";
import { adminNavItems } from "@/data/admin/navigation";

function getPageTitle(pathname) {
  return adminNavItems.find((item) => item.href === pathname)?.label || "Admin";
}

export function AdminShell({ children }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <Link href="/admin" className={styles.brand}>
            <span className={styles.brandMark}>AA</span>
            <span>
              <strong>AuctionArc</strong>
              <small>Admin panel</small>
            </span>
          </Link>
        </div>

        <nav className={styles.nav} aria-label="Admin navigation">
          {adminNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname?.startsWith(item.href));

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
            <p className={styles.eyebrow}>Marketplace command center</p>
            <h1>{title}</h1>
          </div>

          <div className={styles.topbarActions}>
            <button type="button" className={styles.utilityButton}>
              Export Snapshot
            </button>
            <button type="button" className={styles.utilityButton}>
              Audit Queue
            </button>
            <Link href="/logout" className={styles.signoutButton}>
              Sign out
            </Link>
            <div className={styles.profilePill}>
              <span>AD</span>
              <div>
                <strong>Admin</strong>
                <small>Control panel</small>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
