import Link from "next/link";
import styles from "./Footer.module.css";
import { footerSections } from "@/data/site-content";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <Link href="/" className={styles.brand}>
            AuctionArc
          </Link>
          <p>
            A focused auction management experience built to support listings,
            bidding activity, and platform oversight in one place.
          </p>
        </div>

        {footerSections.map((section) => (
          <div key={section.title} className={styles.column}>
            <h2>{section.title}</h2>
            <ul>
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={styles.bottomBar}>
        <p>(c) 2026 AuctionArc. Crafted for structured, transparent auctions.</p>
      </div>
    </footer>
  );
}
