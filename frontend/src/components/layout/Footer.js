import Link from "next/link";
import styles from "./Footer.module.css";
import { footerSections } from "@/data/site-content";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <Link href="/" className={styles.brand}>
            AuctionArc
          </Link>
          <p className={styles.brandCopy}>
            The premier destination for online auctions, helping buyers and
            sellers connect through secure listings, transparent bidding, and
            reliable marketplace tools.
          </p>
        </div>

        {footerSections.map((section) => (
          <div key={section.title} className={styles.column}>
            <h2>{section.title}</h2>
            <ul>
              {section.links.map((link) => (
                <li key={`${section.title}-${link.href}-${link.label}`}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.bottomInner}>
          <span>© {currentYear} AuctionArc. All rights reserved.</span>
          <span>Designed for high-value auctions and secure marketplace operations.</span>
        </div>
      </div>
    </footer>
  );
}
