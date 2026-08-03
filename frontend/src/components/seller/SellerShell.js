"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import styles from "./SellerShell.module.css";

const primaryNavbarItems = [
  { href: "/seller", label: "Dashboard" },
  { href: "/seller/listings", label: "Listings" },
  { href: "/seller/auctions", label: "Auctions" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/messages", label: "Messages" },
  { href: "/seller/messages", label: "Messages" },
];

const secondaryNavbarItems = [
  { href: "/seller/analytics", label: "Analytics" },
  { href: "/seller/notifications", label: "Notifications" },
  { href: "/seller/profile", label: "Profile" },
];

function LogoMark() {
  return <span className={styles.logoGlyph}>A</span>;
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
  return String(name || "AA")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ProfileAvatar({ profile, className }) {
  const imageUrl = profile?.profilePicture?.url;
  const initials = initialsForName(profile?.name);

  if (imageUrl) {
    return (
      <span
        className={`${className} ${styles.profilePhoto}`.trim()}
        style={{ backgroundImage: `url(${imageUrl})` }}
        aria-label={`${profile?.name || "Seller"} profile`}
      />
    );
  }

  return <span className={className}>{initials}</span>;
}

export function SellerShell({ children }) {
  const pathname = usePathname();
  const { user: profile } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const isAccountMenuActive = useMemo(
    () =>
      secondaryNavbarItems.some(
        (item) => pathname === item.href || pathname?.startsWith(item.href),
      ),
    [pathname],
  );

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link href="/seller" className={styles.brand}>
            <LogoMark />
            <span>AuctionArc</span>
          </Link>

          <nav className={styles.topnav} aria-label="Seller top navigation">
            {primaryNavbarItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/seller" && pathname?.startsWith(item.href));

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

          <div className={styles.topbarActions}>
            <NotificationBell notificationsHref="/seller/notifications" />
            <div className={styles.moreMenuWrap}>
              <button
                type="button"
                className={isAccountMenuActive || isAccountMenuOpen ? styles.avatarButtonActive : styles.avatarButton}
                onClick={() => setIsAccountMenuOpen((current) => !current)}
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
                aria-label="Open seller account menu"
              >
                <ProfileAvatar profile={profile} className={styles.avatarInner} />
                <ChevronIcon />
              </button>

              {isAccountMenuOpen ? (
                <div className={styles.moreMenu} role="menu" aria-label="Seller account menu">
                  {secondaryNavbarItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/seller" && pathname?.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={isActive ? styles.moreMenuItemActive : styles.moreMenuItem}
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    );
                  })}

                  <Link
                    href="/logout"
                    className={styles.moreMenuItem}
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
  );
}
