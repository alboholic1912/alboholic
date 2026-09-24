"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./AiNotice.module.css";

export default function AiNotice() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label="AI-generated image notice"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        !
      </button>
      {open && (
        <div className={styles.popover} role="note">
          <p>
            This image was generated using AI for illustrative purposes only. It
            is not authentic historical photography and should not be taken as
            an accurate depiction of people, events or places.
          </p>
        </div>
      )}
    </div>
  );
}
