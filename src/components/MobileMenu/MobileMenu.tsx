"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowIcon } from "@/components/BattleMap/icons";
import EagleMark from "@/components/EagleMark/EagleMark";
import { SECTIONS, isActive } from "@/lib/nav";
import { INSTAGRAM_URL } from "@/lib/site";
import styles from "./MobileMenu.module.css";

const MORE_LINKS = [
  { href: "/sources", label: "Sources" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
];

/** How long the panel takes to fold back into its button (see .panel in the CSS). */
const CLOSE_MS = 420;

/** From here up the header lists the sections itself, so an open menu is put away. */
const WIDE_QUERY = "(min-width: 960px)";

/**
 * The hamburger button and the full-screen menu it opens, for phones and small tablets.
 * The menu grows out of the button as a circle, and its own close button sits exactly over
 * the one that opened it, so the three bars seem to turn into a cross in place.
 *
 * `triggerClassName` styles the button to match the bar it sits in; the close button inside
 * the menu wears the same class.
 */
export default function MobileMenu({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [shownPath, setShownPath] = useState(pathname);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const panelId = useId();

  // Any new page (a link here, the back button, a search result) puts the menu away.
  if (pathname !== shownPath) {
    setShownPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    if (!dialog || !trigger) return;

    if (!open) {
      if (dialog.open) {
        delete dialog.dataset.open;
        closeTimer.current = window.setTimeout(() => dialog.close(), CLOSE_MS);
      }
      return;
    }

    // Where the button is decides where the circle grows from and where the close button goes.
    const place = () => {
      const rect = trigger.getBoundingClientRect();
      if (!rect.width) return;
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      dialog.style.setProperty("--origin-x", `${x}px`);
      dialog.style.setProperty("--origin-y", `${y}px`);
      dialog.style.setProperty("--reach", `${Math.ceil(reach) + 2}px`);
      dialog.style.setProperty("--button-left", `${rect.left}px`);
      dialog.style.setProperty("--button-top", `${rect.top}px`);
    };

    window.clearTimeout(closeTimer.current);
    if (!dialog.open) {
      // The page behind stays put while the menu is open.
      document.documentElement.style.overflow = "hidden";
      place();
      dialog.showModal();
      // Lay the folded-up menu out first, so the reveal has somewhere to start from.
      void dialog.offsetWidth;
    }
    dialog.dataset.open = "";

    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  useEffect(() => {
    const wide = window.matchMedia(WIDE_QUERY);
    const handleChange = () => {
      if (wide.matches) setOpen(false);
    };
    wide.addEventListener("change", handleChange);
    return () => {
      wide.removeEventListener("change", handleChange);
      window.clearTimeout(closeTimer.current);
      document.documentElement.style.overflow = "";
    };
  }, []);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={[styles.button, triggerClassName].filter(Boolean).join(" ")}
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
      >
        <Bars />
      </button>

      <dialog
        ref={dialogRef}
        id={panelId}
        className={styles.panel}
        aria-label="Menu"
        // Escape, or the back gesture on Android: fold the menu away rather than snapping it shut.
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => {
          document.documentElement.style.overflow = "";
          delete dialogRef.current?.dataset.open;
          setOpen(false);
        }}
        // Keys belong to the menu while it is open, not to the page's shortcuts underneath.
        onKeyDown={(event) => event.stopPropagation()}
      >
        {/* First, so it is what the menu focuses when it opens. */}
        <button
          type="button"
          className={[styles.button, styles.close, triggerClassName].filter(Boolean).join(" ")}
          aria-label="Close menu"
          onClick={close}
        >
          <Bars />
        </button>

        <EagleMark size={360} className={styles.watermark} />

        <div className={styles.scroller}>
          <div className={`container ${styles.inner}`}>
            <div className={styles.top}>
              <Link href="/" className={styles.brand} onClick={close}>
                <span className={styles.shield}>
                  <EagleMark size={24} />
                </span>
                <span className={styles.brandText}>Alboholic</span>
              </Link>
            </div>

            <nav aria-label="Sections">
              <ol className={styles.sections}>
                {SECTIONS.map((section, index) => {
                  const active = isActive(pathname, section.href);
                  return (
                    <li key={section.href} className={styles.reveal} style={{ "--i": index } as CSSProperties}>
                      <Link
                        href={section.href}
                        className={styles.section}
                        aria-current={active ? "page" : undefined}
                        onClick={close}
                      >
                        <span className={styles.number} aria-hidden="true">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className={styles.label}>{section.label}</span>
                        <span className={styles.note}>{section.note}</span>
                        <span className={styles.arrow} aria-hidden="true">
                          <ArrowIcon size={20} />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <div className={`${styles.bottom} ${styles.reveal}`} style={{ "--i": SECTIONS.length } as CSSProperties}>
              <Link href="/subscribe" className={styles.subscribe} onClick={close}>
                <span>
                  <strong>Subscribe</strong>
                  <span>New stories, straight to your inbox</span>
                </span>
                <ArrowIcon size={20} />
              </Link>

              <ul className={styles.more}>
                {MORE_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={pathname === link.href ? "page" : undefined}
                      onClick={close}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                    Instagram <span aria-hidden="true">↗</span>
                  </a>
                </li>
              </ul>

              <p className={styles.tagline}>Real stories. Enduring history.</p>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}

/** Three bars that cross into an X while the menu is open. */
function Bars() {
  return (
    <span className={styles.bars} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
