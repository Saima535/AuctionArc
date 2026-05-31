import Link from "next/link";
import styles from "./Navbar.module.css";
import { navLinks } from "@/data/site-content";
import { useAuth } from "@/components/auth/AuthProvider";

function getDashboardHref(auth) {
  if (auth?.destination) {
    return auth.destination;
  }

  if (auth?.role === "Admin") {
    return "/admin";
  }

  if (auth?.role === "Seller") {
    return "/seller";
  }

  if (auth?.role === "Bidder") {
    return "/bidder/auctions";
  }

  return "/";
}

function getProfileHref(role) {
  if (role === "Admin") {
    return "/admin";
  }

  if (role === "Seller") {
    return "/seller/profile";
  }

  if (role === "Bidder") {
    return "/bidder/profile";
  }

  return "/";
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

export function Navbar() {
  const auth = useAuth();
  const dashboardHref = getDashboardHref(auth);
  const profileHref = getProfileHref(auth.role);
  const avatarLabel = auth.user?.name || "Account";

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="AuctionArc homepage">
          <span className={styles.brandMark}>AA</span>
          <span className={styles.brandText}>
            <strong>AuctionArc</strong>
            <span>Smart auction management</span>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={styles.link}>
              {link.label}
            </Link>
          ))}
        </nav>

        {auth.isReady ? (
          <div className={styles.actions}>
            {auth.isAuthenticated ? (
              <>
                <Link href={dashboardHref} className={styles.secondaryAction}>
                  Dashboard
                </Link>
                <Link href="/logout" className={styles.secondaryAction}>
                  Logout
                </Link>
                <Link
                  href={profileHref}
                  className={styles.avatarAction}
                  aria-label={`${avatarLabel} profile`}
                  title={avatarLabel}
                >
                  {initialsForName(auth.user?.name)}
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className={styles.secondaryAction}>
                  Register
                </Link>
                <Link href="/login" className={styles.primaryAction}>
                  Sign In
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className={styles.actions} aria-hidden="true" />
        )}
      </div>
    </header>
  );
}
