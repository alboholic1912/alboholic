"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Footer.module.css";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/stories", label: "Stories" },
  { href: "/people", label: "People" },
  { href: "/battles", label: "Battles" },
  { href: "/about", label: "About" },
  { href: "/sources", label: "Sources" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  const pathname = usePathname();

  // The Studio has its own chrome, and the Battles map fills the screen.
  if (pathname?.startsWith("/kalaja-cabb0da6") || pathname === "/battles") {
    return null;
  }

  return (
    // The home page ends in a full-width strip that the footer follows directly.
    <footer className={[styles.footer, pathname === "/" && styles.flush].filter(Boolean).join(" ")}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandBlock}>
          <Link href="/" className={styles.brand}>
            Alboholic
          </Link>
          <p className={styles.tagline}>Real stories. Enduring history.</p>
        </div>

        <nav aria-label="Footer">
          <ul className={styles.links}>
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className={`container ${styles.legal}`}>
        <p>© {new Date().getFullYear()} Alboholic. Images marked AI-generated are for illustrative purposes only.</p>
        <p>Honoring one of Europe’s oldest cultures.</p>
      </div>
    </footer>
  );
}
