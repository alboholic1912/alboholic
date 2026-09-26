"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Footer.module.css";

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/kalaja-cabb0da6")) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandBlock}>
          <span className={styles.brand}>Alboholic</span>
          <p className={styles.tagline}>
            Real stories, trusted sources — a deeper understanding of Albania
            and its people.
          </p>
        </div>

        <div className={styles.linkGroups}>
          <div className={styles.group}>
            <span className={styles.groupTitle}>Explore</span>
            <Link href="/stories">Stories</Link>
            <Link href="/people">People</Link>
            <Link href="/places">Places</Link>
            <Link href="/periods">Periods</Link>
          </div>
          <div className={styles.group}>
            <span className={styles.groupTitle}>About</span>
            <Link href="/about">About Alboholic</Link>
            <Link href="/sources">Sources & Methodology</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>

      <div className="container">
        <p className={styles.copyright}>
          © {new Date().getFullYear()} Alboholic. Images marked AI-generated are
          for illustrative purposes only.
        </p>
      </div>
    </footer>
  );
}
