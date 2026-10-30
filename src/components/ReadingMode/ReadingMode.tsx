"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BodyBlock } from "@/components/StoryBody/StoryBody";
import styles from "./ReadingMode.module.css";

type Theme = "dark" | "sepia" | "light";
type Face = "serif" | "sans";
type Settings = { size: number; theme: Theme; face: Face };

const SIZES = [16, 18, 20, 22, 24, 27];
const THEMES: { id: Theme; label: string }[] = [
  { id: "dark", label: "Dark" },
  { id: "sepia", label: "Sepia" },
  { id: "light", label: "Light" },
];
const DEFAULTS: Settings = { size: 2, theme: "dark", face: "serif" };
const STORAGE_KEY = "alboholic:reader";

function loadSettings(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<Settings>;
    return {
      size: typeof saved.size === "number" && SIZES[saved.size] ? saved.size : DEFAULTS.size,
      theme: THEMES.some((t) => t.id === saved.theme) ? (saved.theme as Theme) : DEFAULTS.theme,
      face: saved.face === "sans" ? "sans" : DEFAULTS.face,
    };
  } catch {
    return DEFAULTS;
  }
}

type Props = {
  title: string;
  category: string;
  date: string;
  readTime: string;
  body: string[];
};

export default function ReadingMode({ title, category, date, readTime, body }: Props) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [barHidden, setBarHidden] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const lastScroll = useRef(0);

  function openReader() {
    setSettings(loadSettings());
    setBarHidden(false);
    lastScroll.current = 0;
    setOpen(true);
  }

  function update(next: Partial<Settings>) {
    setSettings((current) => {
      const merged = { ...current, ...next };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // Private mode or blocked storage: settings just won't be remembered.
      }
      return merged;
    });
  }

  // While open: lock the page behind, close on Escape, and hand focus back on exit.
  useEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);

    return () => {
      root.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      trigger?.focus();
    };
  }, [open]);

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const el = event.currentTarget;
    const max = el.scrollHeight - el.clientHeight;
    const top = el.scrollTop;

    if (progressRef.current) {
      progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, top / max) : 1})`;
    }

    // Tuck the toolbar away while reading down; bring it back on any scroll up or near the top.
    const delta = top - lastScroll.current;
    if (top < 80 || delta < -6) setBarHidden(false);
    else if (delta > 6) setBarHidden(true);
    lastScroll.current = top;
  }

  const reader = open
    ? createPortal(
        <div
          className={styles.overlay}
          data-theme={settings.theme}
          data-face={settings.face}
          style={{ "--reader-size": `${SIZES[settings.size]}px` } as React.CSSProperties}
          role="dialog"
          aria-modal="true"
          aria-label={`Reading mode: ${title}`}
          onScroll={handleScroll}
        >
          <div className={styles.progress} aria-hidden="true">
            <div ref={progressRef} className={styles.progressFill} />
          </div>

          <div className={`${styles.toolbar} ${barHidden ? styles.toolbarHidden : ""}`}>
            <button
              ref={closeRef}
              type="button"
              className={styles.exit}
              onClick={() => setOpen(false)}
              aria-label="Exit reading mode"
            >
              <CloseIcon />
              <span className={styles.exitLabel}>Exit</span>
            </button>

            <div className={styles.controls}>
              <div className={styles.group} role="group" aria-label="Text size">
                <button
                  type="button"
                  className={styles.tool}
                  onClick={() => update({ size: Math.max(0, settings.size - 1) })}
                  disabled={settings.size === 0}
                  aria-label="Smaller text"
                >
                  <span className={styles.smallA}>A</span>
                </button>
                <button
                  type="button"
                  className={styles.tool}
                  onClick={() => update({ size: Math.min(SIZES.length - 1, settings.size + 1) })}
                  disabled={settings.size === SIZES.length - 1}
                  aria-label="Larger text"
                >
                  <span className={styles.bigA}>A</span>
                </button>
              </div>

              <button
                type="button"
                className={styles.tool}
                onClick={() => update({ face: settings.face === "serif" ? "sans" : "serif" })}
                aria-label={settings.face === "serif" ? "Switch to sans-serif font" : "Switch to serif font"}
                title={settings.face === "serif" ? "Sans-serif" : "Serif"}
              >
                <span className={settings.face === "serif" ? styles.faceSans : styles.faceSerif}>Aa</span>
              </button>

              <div className={styles.group} role="radiogroup" aria-label="Theme">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    role="radio"
                    aria-checked={settings.theme === theme.id}
                    aria-label={theme.label}
                    title={theme.label}
                    className={styles.swatchButton}
                    onClick={() => update({ theme: theme.id })}
                  >
                    <span className={styles.swatch} data-swatch={theme.id} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <article className={styles.page}>
            <header className={styles.head}>
              <p className={styles.meta}>
                <span className={styles.category}>{category}</span>
                <span>{date}</span>
                <span>{readTime}</span>
              </p>
              <h1 className={styles.title}>{title}</h1>
            </header>

            <div className={styles.text}>
              {body.map((block, index) => (
                <BodyBlock key={index} text={block} />
              ))}
            </div>

            <footer className={styles.end}>
              <span className={styles.endMark} aria-hidden="true">
                ✦
              </span>
              <button type="button" className={styles.endButton} onClick={() => setOpen(false)}>
                Exit reading mode
              </button>
            </footer>
          </article>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={openReader}
        aria-haspopup="dialog"
      >
        <BookIcon />
        Reading mode
      </button>
      {reader}
    </>
  );
}

function BookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 6.5C10.3 5 7.8 4.5 4 4.5v13c3.8 0 6.3.5 8 2m0-13c1.7-1.5 4.2-2 8-2v13c-3.8 0-6.3.5-8 2m0-13v13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
