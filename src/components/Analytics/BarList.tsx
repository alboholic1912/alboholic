import type { ReactNode } from "react";
import { formatCount } from "./format";
import styles from "./analytics.module.css";

export interface BarItem {
  key: string;
  label: ReactNode;
  /** Shown small under the label, e.g. the page address. */
  sublabel?: ReactNode;
  icon?: ReactNode;
  value: number;
  /** Optional second number, shown dimmer before the main one. */
  secondary?: string;
}

/**
 * A ranked list with a thin bar under each name. Every value is printed, so the bars only
 * help the eye compare.
 */
export default function BarList({
  items,
  empty = "Nothing yet.",
  color = "var(--reagent)",
  total,
}: {
  items: BarItem[];
  empty?: string;
  color?: string;
  /** What the shares are out of. Defaults to the sum of the items shown. */
  total?: number;
}) {
  if (items.length === 0) return <p className={styles.empty}>{empty}</p>;
  const max = Math.max(1, ...items.map((item) => item.value));
  const whole = total || items.reduce((sum, item) => sum + item.value, 0);

  return (
    <ol className={styles.barList}>
      {items.map((item) => (
        <li key={item.key} className={styles.barRow}>
          <div className={styles.barTop}>
            {item.icon && <span className={styles.barIcon}>{item.icon}</span>}
            <span className={styles.barLabel}>
              <span className={styles.barName}>{item.label}</span>
              {item.sublabel && <span className={styles.barSub}>{item.sublabel}</span>}
            </span>
            {item.secondary && <span className={styles.barSecondary}>{item.secondary}</span>}
            <span className={styles.barValue}>{formatCount(item.value)}</span>
            <span className={styles.barShare}>{whole > 0 ? `${Math.min(100, Math.round((item.value / whole) * 100))}%` : ""}</span>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${(item.value / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
