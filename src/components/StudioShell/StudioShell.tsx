"use client";

import { useState } from "react";
import type { JSX, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/kalaja-cabb0da6/actions";
import SubmitButton from "@/components/SubmitButton/SubmitButton";
import {
  DashboardIcon,
  BookIcon,
  UsersIcon,
  ClockIcon,
  PinIcon,
  BulbIcon,
  LogoutIcon,
  ExternalIcon,
  MenuIcon,
  CloseIcon,
} from "./icons";
import styles from "./StudioShell.module.css";

const NAV_ITEMS: { href: string; label: string; icon: () => JSX.Element; exact?: boolean }[] = [
  { href: "/kalaja-cabb0da6", label: "Dashboard", icon: DashboardIcon, exact: true },
  { href: "/kalaja-cabb0da6/stories", label: "Stories", icon: BookIcon },
  { href: "/kalaja-cabb0da6/people", label: "People", icon: UsersIcon },
  { href: "/kalaja-cabb0da6/periods", label: "Periods", icon: ClockIcon },
  { href: "/kalaja-cabb0da6/places", label: "Places", icon: PinIcon },
  { href: "/kalaja-cabb0da6/ideas", label: "Ideas", icon: BulbIcon },
];

export default function StudioShell({
  userEmail,
  children,
}: {
  userEmail: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname === "/kalaja-cabb0da6/login") {
    return <>{children}</>;
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : "?";

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/kalaja-cabb0da6" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            🛡
          </span>
          <span className={styles.brandText}>Studio</span>
        </Link>

        <nav className={styles.nav} aria-label="Studio">
          <ul>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={active ? styles.navLinkActive : styles.navLink}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.viewSite}>
            <ExternalIcon />
            View live site
          </Link>
          <div className={styles.account}>
            <span className={styles.avatar} aria-hidden="true">
              {initial}
            </span>
            <span className={styles.userEmail} title={userEmail ?? undefined}>
              {userEmail ?? "Signed in"}
            </span>
          </div>
          <form action={signOut}>
            <SubmitButton className={styles.signOut} pendingText="Signing out…">
              <LogoutIcon />
              Sign out
            </SubmitButton>
          </form>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuButton}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <Link href="/kalaja-cabb0da6" className={styles.topbarBrand}>
            <span className={styles.brandMark} aria-hidden="true">
              🛡
            </span>
            <span className={styles.brandText}>Studio</span>
          </Link>
          <span className={styles.avatar} aria-hidden="true">
            {initial}
          </span>
        </header>

        {menuOpen && (
          <nav className={styles.mobileNav} aria-label="Studio mobile">
            <ul>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className={styles.mobileNavFooter}>
              <span className={styles.userEmail}>{userEmail ?? "Signed in"}</span>
              <form action={signOut}>
                <SubmitButton className={styles.signOut} pendingText="Signing out…">
                  <LogoutIcon />
                  Sign out
                </SubmitButton>
              </form>
            </div>
          </nav>
        )}

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
