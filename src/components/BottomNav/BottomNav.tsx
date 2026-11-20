"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookIcon, PeopleIcon, VersusIcon } from "@/components/BattleMap/icons";
import styles from "./BottomNav.module.css";

const TABS = [
  { href: "/stories", label: "Stories", icon: BookIcon },
  { href: "/people", label: "People", icon: PeopleIcon },
  { href: "/battles", label: "Battles", icon: VersusIcon },
];

/**
 * The three sections, within reach of a thumb, on every public page. Phones only: from
 * 960px up the header carries the navigation and this renders nothing visible.
 */
export default function BottomNav() {
  const pathname = usePathname();

  if (pathname?.startsWith("/kalaja-cabb0da6")) {
    return null;
  }

  return (
    <>
      {/* The bar is fixed to the screen; this holds its place at the end of the page. */}
      <div className={styles.spacer} aria-hidden="true" />

      <nav className={styles.nav} aria-label="Sections">
        <ul>
          {TABS.map(({ href, label, icon: Icon }) => {
            // A section stays highlighted on its detail pages, e.g. People on /people/[slug].
            const active = pathname === href || Boolean(pathname?.startsWith(`${href}/`));
            return (
              <li key={href}>
                <Link href={href} className={active ? styles.active : undefined} aria-current={active ? "page" : undefined}>
                  <Icon size={24} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
