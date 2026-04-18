"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BuyerShell.module.css";

const navItems = [
  { href: "/bidder", label: "Home" },
  { href: "/bidder/discover", label: "Auctions" },
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

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 17v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M14 16l5-4-5-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M19 12H9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function BuyerShell({ children }) {
  const pathname = usePathname();

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
            {navItems.map((item) => {
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
            <Link href="/logout" className={styles.logoutLink}>
              <LogoutIcon />
              <span>Logout</span>
            </Link>

            <Link href="/bidder/profile" className={styles.avatarWrap} aria-label="Open profile">
              <Image
                src="/buyer-avatar.svg"
                alt="Buyer profile"
                width={46}
                height={46}
                className={styles.avatar}
                priority
              />
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
