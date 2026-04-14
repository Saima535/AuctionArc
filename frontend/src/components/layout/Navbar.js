import Link from "next/link";
import styles from "./Navbar.module.css";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#roles", label: "Roles" },
  { href: "#how-it-works", label: "How It Works" },
];

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
            <a key={link.href} href={link.href} className={styles.link}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <a href="#roles" className={styles.secondaryAction}>
            Explore Roles
          </a>
          <a href="#hero" className={styles.primaryAction}>
            Get Started
          </a>
        </div>
      </div>
    </header>
  );
}
