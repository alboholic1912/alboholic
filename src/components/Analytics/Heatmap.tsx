"use client";

import { useState } from "react";
import type { Report } from "@/lib/analytics/types";
import { formatCount } from "./format";
import styles from "./analytics.module.css";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
/** One hue from faint to strong; an empty hour stays the panel colour. */
const LEVELS = [0.16, 0.34, 0.58, 0.9];

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** Page views by weekday and hour of day: when people read. */
export default function Heatmap({ heat }: { heat: Report["heat"] }) {
  const [hover, setHover] = useState<{ dow: number; hour: number } | null>(null);
  const grid = new Map(heat.map((cell) => [`${cell.dow}-${cell.hour}`, cell.views]));
  const max = Math.max(0, ...heat.map((cell) => cell.views));
  const busiest = heat.reduce<Report["heat"][number] | null>((best, cell) => (!best || cell.views > best.views ? cell : best), null);

  const level = (views: number) => {
    if (views === 0 || max === 0) return 0;
    return LEVELS[Math.min(LEVELS.length - 1, Math.floor((views / max) * LEVELS.length - 1e-9))];
  };

  const hovered = hover ? (grid.get(`${hover.dow}-${hover.hour}`) ?? 0) : 0;

  return (
    <div className={styles.heatBlock}>
      <p className={styles.heatSummary}>
        {busiest ? (
          <>
            Busiest: <strong>{DAY_NAMES[busiest.dow - 1]}s around {hourLabel(busiest.hour)}</strong> ·{" "}
            {formatCount(busiest.views)} page views
          </>
        ) : (
          "No page views in this range yet."
        )}
      </p>
      <div className={styles.heatScroll}>
        <div className={styles.heatGrid} onPointerLeave={() => setHover(null)}>
          <span />
          {Array.from({ length: 24 }, (_, hour) => (
            <span key={hour} className={styles.heatHour}>
              {hour % 6 === 0 ? hourLabel(hour) : ""}
            </span>
          ))}
          {DAYS.map((day, index) => {
            const dow = index + 1;
            return [
              <span key={day} className={styles.heatDay}>
                {day}
              </span>,
              ...Array.from({ length: 24 }, (_, hour) => {
                const views = grid.get(`${dow}-${hour}`) ?? 0;
                const alpha = level(views);
                const active = hover?.dow === dow && hover.hour === hour;
                return (
                  <span
                    key={`${day}-${hour}`}
                    className={`${styles.heatCell} ${active ? styles.heatCellActive : ""}`}
                    style={alpha ? { background: `rgba(239, 64, 69, ${alpha})` } : undefined}
                    aria-label={`${DAY_NAMES[index]} ${hourLabel(hour)}: ${views} page views`}
                    onPointerEnter={() => setHover({ dow, hour })}
                  />
                );
              }),
            ];
          })}
        </div>
      </div>
      <div className={styles.heatFooter}>
        <span className={styles.heatReadout} aria-live="polite">
          {hover ? (
            <>
              <strong>{formatCount(hovered)}</strong> page views · {DAY_NAMES[hover.dow - 1]} {hourLabel(hover.hour)}
            </>
          ) : (
            "Point at an hour to see its page views."
          )}
        </span>
        <span className={styles.heatScale} aria-hidden="true">
          Fewer
          {[0, ...LEVELS].map((alpha) => (
            <span
              key={alpha}
              className={styles.heatCell}
              style={alpha ? { background: `rgba(239, 64, 69, ${alpha})` } : undefined}
            />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
