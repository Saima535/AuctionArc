"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./SellerShell.module.css";

const sidebarItems = [
  { href: "/seller", label: "Dashboard", icon: "grid" },
  { href: "/seller/listings", label: "Listings", icon: "cube" },
  { href: "/seller/messages", label: "Messages", icon: "message" },
];

const topLinks = [
  { href: "/", label: "Home" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/register", label: "Become Buyer" },
];

function LogoMark() {
  return <span className={styles.logoGlyph}>A</span>;
}

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

function CubeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 3 7 4v10l-7 4-7-4V7l7-4Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="m5 7 7 4 7-4M12 11v10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H10l-4.5 4v-4H7.5A2.5 2.5 0 0 1 5 13.5v-7Z"
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
  if (icon === "cube") {
    return <CubeIcon />;
  }

  if (icon === "message") {
    return <MessageIcon />;
  }

  return <GridIcon />;
}

export function SellerShell({ children }) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link href="/seller" className={styles.brand}>
            <LogoMark />
            <span>AuctionArc</span>
          </Link>

          <nav className={styles.topnav} aria-label="Seller top navigation">
            {topLinks.map((item) => (
              <Link key={item.href} href={item.href} className={styles.topnavLink}>
                {item.label}
              </Link>
            ))}
            <Link href="/logout" className={styles.topnavLink}>
              Logout
            </Link>
          </nav>

          <div className={styles.topbarActions}>
            <button type="button" className={styles.iconButton} aria-label="Notifications">
              <BellIcon />
              <span className={styles.notificationDot} />
            </button>
            <Link href="/seller/profile" className={styles.initialAvatar}>
              JD
            </Link>
          </div>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <div className={styles.profileBlock}>
            <span className={styles.profileBadge}>JD</span>
            <div>
              <strong>John Doe</strong>
              <p>john@example.com</p>
            </div>
          </div>

          <nav className={styles.sidebarNav} aria-label="Seller navigation">
            {sidebarItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/seller" && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive ? styles.sidebarItemActive : styles.sidebarItem}
                >
                  <SidebarIcon icon={item.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className={styles.contentWrap}>
          <main className={styles.content}>{children}</main>

          <footer className={styles.footer}>
            <div className={styles.footerInner}>
              <div className={styles.footerBrand}>
                <LogoMark />
                <span>&copy; 2026 AuctionArc. All rights reserved.</span>
              </div>

              <div className={styles.footerLinks}>
                <Link href="/privacy">Privacy Policy</Link>
                <Link href="/terms">Terms of Service</Link>
                <Link href="/support">Help Center</Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
