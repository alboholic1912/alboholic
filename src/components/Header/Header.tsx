"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import EagleMark from "@/components/EagleMark/EagleMark";
import MobileMenu from "@/components/MobileMenu/MobileMenu";
import SearchDialog from "@/components/SearchDialog/SearchDialog";
import { SECTIONS, isActive } from "@/lib/nav";
import styles from "./Header.module.css";

// The Battles map is a full-screen page with its own top bar on phones.
const IMMERSIVE_PATH = "/battles";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const inStudio = Boolean(pathname?.startsWith("/kalaja-cabb0da6"));

  // Ctrl+K / Cmd+K, or "/" outside a text field, opens the search from anywhere.
  useEffect(() => {
    if (inStudio) return;
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "");
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing)) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [inStudio]);

  if (inStudio) {
    return null;
  }

  return (
    <header className={[styles.header, pathname === IMMERSIVE_PATH && styles.immersive].filter(Boolean).join(" ")}>
      <div className={`container ${styles.bar}`}>
        <Link href="/" className={styles.brand}>
          <span className={styles.shield}>
            <EagleMark size={24} />
          </span>
          <span className={styles.brandText}>Alboholic</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <ul>
            {SECTIONS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={active ? styles.navLinkActive : undefined}
                    aria-current={active ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Search"
            aria-haspopup="dialog"
            title="Search (Ctrl+K)"
            onClick={() => setSearchOpen(true)}
          >
            <SearchIcon />
          </button>
          <Link href="/subscribe" className={styles.subscribeButton}>
            Subscribe
          </Link>
          <MobileMenu triggerClassName={styles.menuButton} />
        </div>
      </div>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
