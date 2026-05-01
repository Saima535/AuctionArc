"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styles from "./AdminShell.module.css";
import { adminNavItems } from "@/data/admin/navigation";
import { apiRequest } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";

function getPageTitle(pathname) {
  return adminNavItems.find((item) => item.href === pathname)?.label || "Admin";
}

export function AdminShell({ children }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const { data: profile } = useApiData("/users/me/profile", {
    initialData: {
      name: "Admin",
      role: "Admin",
    },
  });
  const [isExporting, setIsExporting] = useState(false);
  const initials = String(profile?.name || "Admin")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  async function handleExportSnapshot() {
    setIsExporting(true);

    try {
      const [
        dashboard,
        users,
        products,
        auctions,
        bids,
        reports,
        transactions,
        settings,
      ] = await Promise.all([
        apiRequest("/dashboard/admin"),
        apiRequest("/admin/users"),
        apiRequest("/admin/products"),
        apiRequest("/admin/auctions"),
        apiRequest("/admin/bids"),
        apiRequest("/admin/reports"),
        apiRequest("/admin/transactions"),
        apiRequest("/admin/settings"),
      ]);

      const snapshot = {
        exportedAt: new Date().toISOString(),
        dashboard: dashboard.data,
        users: users.data,
        products: products.data,
        auctions: auctions.data,
        bids: bids.data,
        reports: reports.data,
        transactions: transactions.data,
        settings: settings.data,
      };
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `auctionarc-admin-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

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
            <button type="button" className={styles.utilityButton} disabled={isExporting} onClick={handleExportSnapshot}>
              {isExporting ? "Exporting..." : "Export Snapshot"}
            </button>
            <Link href="/admin/reports" className={styles.utilityButton}>
              Audit Queue
            </Link>
            <Link href="/logout" className={styles.signoutButton}>
              Sign out
            </Link>
            <div className={styles.profilePill}>
              <span>{initials || "AD"}</span>
              <div>
                <strong>{profile?.name || "Admin"}</strong>
                <small>{profile?.role || "Control panel"}</small>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
