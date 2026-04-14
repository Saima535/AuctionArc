import Link from "next/link";
import styles from "./Navbar.module.css";
import { navLinks } from "@/data/site-content";

export function Navbar() {
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

        <div className={styles.actions}>
          <Link href="/login" className={styles.secondaryAction}>
            Login
          </Link>
          <Link href="/register" className={styles.primaryAction}>
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
