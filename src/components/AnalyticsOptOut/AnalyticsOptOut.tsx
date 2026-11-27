"use client";

import { useState, useSyncExternalStore } from "react";
import { OPT_OUT_KEY } from "@/components/SiteAnalytics/PageTracker";
import styles from "./AnalyticsOptOut.module.css";

type Choice = "counted" | "not-counted" | "blocked" | "unknown";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readChoice(): Choice {
  try {
    return window.localStorage.getItem(OPT_OUT_KEY) === "1" ? "not-counted" : "counted";
  } catch {
    return "blocked";
  }
}

/**
 * A switch that keeps this browser's visits out of our visitor numbers. The choice is saved in
 * this browser only, because there are no reader accounts to save it to.
 */
export default function AnalyticsOptOut() {
  // "unknown" on the server, so the first render never shows the wrong state.
  const choice = useSyncExternalStore(subscribe, readChoice, (): Choice => "unknown");
  const [saveFailed, setSaveFailed] = useState(false);

  const toggle = () => {
    try {
      if (choice === "counted") window.localStorage.setItem(OPT_OUT_KEY, "1");
      else window.localStorage.removeItem(OPT_OUT_KEY);
      for (const listener of listeners) listener();
    } catch {
      setSaveFailed(true);
    }
  };

  if (choice === "blocked" || saveFailed) {
    return (
      <p className={styles.note}>
        This browser is blocking site storage (a private window does this), so the choice can&rsquo;t be saved here.
      </p>
    );
  }

  const optedOut = choice === "not-counted";

  return (
    <div className={styles.box} aria-live="polite">
      <p className={styles.state}>
        <span className={optedOut ? styles.dotOff : styles.dotOn} aria-hidden="true" />
        {choice === "unknown"
          ? "Checking this browser…"
          : optedOut
            ? "Your visits from this browser are not counted."
            : "Your visits from this browser are counted, anonymously."}
      </p>
      <button type="button" className={styles.button} onClick={toggle} disabled={choice === "unknown"}>
        {optedOut ? "Count my visits again" : "Don’t count my visits"}
      </button>
    </div>
  );
}
