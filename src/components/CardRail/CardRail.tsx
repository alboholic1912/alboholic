"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronIcon } from "@/components/BattleMap/icons";
import styles from "./CardRail.module.css";

/**
 * A row of cards that scrolls sideways once there are more than fit: swiped on a phone, paged
 * with the arrow buttons elsewhere. `label` names the cards, e.g. "stories".
 */
export default function CardRail({ label, children }: { label: string; children: ReactNode }) {
  const railRef = useRef<HTMLDivElement>(null);
  // Which ends still have cards out of view, and so get an arrow.
  const [more, setMore] = useState({ before: false, after: false });

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const measure = () => {
      const before = rail.scrollLeft > 4;
      const after = rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4;
      setMore((current) => (current.before === before && current.after === after ? current : { before, after }));
    };

    // Observing reports the starting size as well, so there is no separate first measurement.
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    rail.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      rail.removeEventListener("scroll", measure);
    };
  }, []);

  function page(direction: 1 | -1) {
    const rail = railRef.current;
    rail?.scrollBy({ left: direction * rail.clientWidth, behavior: "smooth" });
  }

  return (
    <div className={styles.root}>
      <div ref={railRef} className={styles.rail}>
        {children}
      </div>

      {more.before && (
        <button type="button" className={`${styles.arrow} ${styles.previous}`} aria-label={`Previous ${label}`} onClick={() => page(-1)}>
          <ChevronIcon size={18} />
        </button>
      )}
      {more.after && (
        <button type="button" className={`${styles.arrow} ${styles.next}`} aria-label={`More ${label}`} onClick={() => page(1)}>
          <ChevronIcon size={18} />
        </button>
      )}
    </div>
  );
}
