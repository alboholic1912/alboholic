"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { CloseIcon } from "./icons";
import { isDesktop, PEEK_FRACTION } from "./layout";
import styles from "./BottomSheet.module.css";

/** "peek" shows the top of the sheet with the map still in view; "full" gives it nearly the whole screen. */
export type Snap = "peek" | "full";

/** A drag has to travel this far before it takes over from a tap. */
const DRAG_SLOP = 8;
/** A flick faster than this, in pixels per millisecond, moves one stop in its direction wherever it ends. */
const FLICK_SPEED = 0.5;

interface BottomSheetProps {
  open: boolean;
  snap: Snap;
  /** Whether "peek" is a resting position. Without it the sheet is either full height or closed. */
  peekable?: boolean;
  label: string;
  /** Scrolls the content back to the top when it changes, e.g. when another battle is shown. */
  contentKey?: string;
  onSnapChange: (snap: Snap) => void;
  onClose: () => void;
  children: ReactNode;
}

/**
 * On a phone, a sheet that slides up over the map and can be dragged between a peek, full
 * height and closed. On desktop the same element is a floating side panel and none of the
 * drag handling applies.
 */
export default function BottomSheet({
  open,
  snap,
  peekable = true,
  label,
  contentKey,
  onSnapChange,
  onClose,
  children,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startTime: number; base: number; height: number; moved: boolean } | null>(null);
  // A drag that starts on the grip must not also count as a click on it.
  const justDragged = useRef(false);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [contentKey, snap]);

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    const sheet = sheetRef.current;
    if (!sheet || isDesktop() || (event.pointerType === "mouse" && event.button !== 0)) return;

    // At full height the content scrolls, so only the grip at the top drags the sheet.
    const onGrip = Boolean((event.target as Element).closest("[data-sheet-grip]"));
    if (snap === "full" && !onGrip) return;

    justDragged.current = false;
    const height = sheet.offsetHeight;
    drag.current = {
      startY: event.clientY,
      startTime: event.timeStamp,
      base: snap === "full" ? 0 : height * (1 - PEEK_FRACTION),
      height,
      moved: false,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const sheet = sheetRef.current;
    const state = drag.current;
    if (!sheet || !state) return;

    const travel = event.clientY - state.startY;
    if (!state.moved) {
      if (Math.abs(travel) < DRAG_SLOP) return;
      state.moved = true;
      // Capturing only now leaves a plain tap to reach the link or button under the finger.
      sheet.setPointerCapture(event.pointerId);
      sheet.setAttribute("data-dragging", "");
    }
    sheet.style.transform = `translateY(${Math.max(0, state.base + travel)}px)`;
  }

  function handlePointerEnd(event: PointerEvent<HTMLElement>) {
    const sheet = sheetRef.current;
    const state = drag.current;
    drag.current = null;
    if (!sheet || !state?.moved) return;

    justDragged.current = true;
    sheet.removeAttribute("data-dragging");
    sheet.style.transform = "";

    const travel = event.clientY - state.startY;
    const position = Math.max(0, state.base + travel);
    const speed = travel / Math.max(1, event.timeStamp - state.startTime);
    const peekAt = state.height * (1 - PEEK_FRACTION);

    let target: Snap | "closed";
    if (speed < -FLICK_SPEED) {
      target = "full";
    } else if (speed > FLICK_SPEED) {
      target = snap === "full" && peekable ? "peek" : "closed";
    } else if (!peekable) {
      target = position < state.height * 0.35 ? "full" : "closed";
    } else if (position < peekAt / 2) {
      target = "full";
    } else {
      target = position < (peekAt + state.height) / 2 ? "peek" : "closed";
    }

    if (target === "closed") onClose();
    else if (target !== snap) onSnapChange(target);
  }

  // Whatever is tucked below the fold must not take focus (or a scroll) while out of sight.
  function expandIfPeeking() {
    if (open && snap === "peek" && !isDesktop()) onSnapChange("full");
  }

  return (
    <aside
      ref={sheetRef}
      className={styles.sheet}
      aria-label={label}
      data-open={open}
      data-snap={snap}
      inert={!open}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onWheel={(event) => {
        if (event.deltaY > 0) expandIfPeeking();
      }}
    >
      <button
        type="button"
        className={styles.grip}
        data-sheet-grip
        aria-label={snap === "full" && peekable ? "Show less" : "Show more"}
        aria-expanded={snap === "full"}
        onClick={() => {
          if (justDragged.current) return;
          if (snap === "peek") onSnapChange("full");
          else if (peekable) onSnapChange("peek");
          else onClose();
        }}
      >
        <span />
      </button>

      <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
        <CloseIcon size={18} />
      </button>

      <div
        ref={bodyRef}
        className={styles.body}
        onScroll={(event) => sheetRef.current?.toggleAttribute("data-scrolled", event.currentTarget.scrollTop > 8)}
        onFocus={(event) => {
          if (event.target.matches(":focus-visible")) expandIfPeeking();
        }}
      >
        {children}
      </div>
    </aside>
  );
}
