"use client";

import { useState, useRef, useEffect, useId } from "react";
import styles from "./AiNotice.module.css";

/**
 * The "!" badge on an AI-generated image. Its note shows while the pointer is over it (or the
 * badge has keyboard focus). A touch screen has no hover, so there a tap shows and hides it.
 */
export default function AiNotice() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const noteId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef} data-open={open || undefined}>
      <button
        type="button"
        className={styles.trigger}
        aria-label="AI-generated image"
        aria-describedby={noteId}
        onClick={(event) => {
          // The badge sits on cards that are links: pressing it never opens the page.
          event.preventDefault();
          event.stopPropagation();
          if (window.matchMedia("(hover: none)").matches) setOpen((value) => !value);
        }}
      >
        !
      </button>
      <div id={noteId} className={styles.popover} role="tooltip">
        <p>
          This image was generated using AI for illustrative purposes only. It
          is not authentic historical photography and should not be taken as
          an accurate depiction of people, events or places.
        </p>
      </div>
    </div>
  );
}
