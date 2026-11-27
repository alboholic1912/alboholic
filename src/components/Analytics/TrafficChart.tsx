"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { Report } from "@/lib/analytics/types";
import { bucketLabel, formatCount } from "./format";
import styles from "./analytics.module.css";

/** Checked with the dataviz palette validator against the Studio's dark panels. */
export const VISITORS_COLOR = "#ef4045";
export const VIEWS_COLOR = "#3987e5";

const HEIGHT = 260;
const PAD = { top: 14, right: 14, bottom: 30, left: 40 };

/** A round step for about four gridlines: 1, 2, 5, 10, 20, 50… */
function niceStep(max: number): number {
  const rough = Math.max(max / 4, 1);
  const power = 10 ** Math.floor(Math.log10(rough));
  const n = rough / power;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * power;
}

function linePath(points: [number, number][]): string {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
}

/**
 * Visitors (filled) and page views (line) over the chosen range, one point per hour or day.
 * One axis, since both are counts. The crosshair follows the pointer or the arrow keys.
 */
export default function TrafficChart({ series, range }: { series: Report["series"]; range: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, [showTable]);

  const n = series.length;
  const innerW = Math.max(width - PAD.left - PAD.right, 1);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const peak = Math.max(1, ...series.map((p) => Math.max(p.views, p.visitors)));
  const step = niceStep(peak);
  const top = Math.ceil(peak / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);

  const x = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;

  const visitorPoints = series.map((p, i) => [x(i), y(p.visitors)] as [number, number]);
  const viewPoints = series.map((p, i) => [x(i), y(p.views)] as [number, number]);
  const baseline = y(0);
  const area =
    n > 0
      ? `${linePath(visitorPoints)}L${x(n - 1).toFixed(1)},${baseline}L${x(0).toFixed(1)},${baseline}Z`
      : "";

  const maxLabels = Math.max(2, Math.floor(innerW / 64));
  const labelEvery = Math.max(1, Math.ceil(n / maxLabels));

  const onPointer = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    setHover(Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1)))));
  };

  const onKey = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? -1) + 1));
    else if (event.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? n) - 1));
    else if (event.key === "Escape") setHover(null);
    else return;
    event.preventDefault();
  };

  const hovered = hover !== null ? series[hover] : null;
  const tipLeft = hover !== null ? x(hover) : 0;
  const tipFlip = tipLeft > width - 170;

  return (
    <div className={styles.chartBlock}>
      <div className={styles.chartTools}>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendLine} style={{ background: VISITORS_COLOR }} />
            Visitors
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendLine} style={{ background: VIEWS_COLOR }} />
            Page views
          </span>
        </div>
        <button type="button" className={styles.textButton} onClick={() => setShowTable((v) => !v)}>
          {showTable ? "Show chart" : "Show table"}
        </button>
      </div>

      {showTable ? (
        <div className={styles.tableScroll}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th scope="col">{range === "24h" ? "Hour" : "Day"}</th>
                <th scope="col">Visitors</th>
                <th scope="col">Page views</th>
              </tr>
            </thead>
            <tbody>
              {[...series].reverse().map((p) => (
                <tr key={p.t}>
                  <td>{bucketLabel(p.t, range, true)}</td>
                  <td>{formatCount(p.visitors)}</td>
                  <td>{formatCount(p.views)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={wrapRef} className={styles.chartWrap} style={{ height: HEIGHT }}>
          {width > 0 && (
            <svg
              width={width}
              height={HEIGHT}
              className={styles.chartSvg}
              tabIndex={0}
              role="img"
              aria-label={`Visitors and page views, ${n} ${range === "24h" ? "hours" : "days"}. Use the arrow keys to read each point.`}
              onKeyDown={onKey}
              onBlur={() => setHover(null)}
            >
              <defs>
                <linearGradient id="visitorsWash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={VISITORS_COLOR} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={VISITORS_COLOR} stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {ticks.map((tick) => (
                <g key={tick}>
                  <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} className={styles.gridLine} />
                  <text x={PAD.left - 8} y={y(tick)} className={styles.axisText} textAnchor="end" dominantBaseline="middle">
                    {formatCount(tick)}
                  </text>
                </g>
              ))}

              {series.map((p, i) =>
                i % labelEvery === 0 || i === n - 1 ? (
                  i !== n - 1 && n - 1 - i < labelEvery * 0.6 ? null : (
                    <text key={p.t} x={x(i)} y={HEIGHT - 8} className={styles.axisText} textAnchor="middle">
                      {bucketLabel(p.t, range)}
                    </text>
                  )
                ) : null,
              )}

              <path d={area} fill="url(#visitorsWash)" />
              <path d={linePath(viewPoints)} fill="none" stroke={VIEWS_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              <path d={linePath(visitorPoints)} fill="none" stroke={VISITORS_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

              {hover === null && n > 0 && (
                <circle cx={x(n - 1)} cy={y(series[n - 1].visitors)} r="4" fill={VISITORS_COLOR} className={styles.markRing} />
              )}

              {hovered && hover !== null && (
                <g pointerEvents="none">
                  <line x1={tipLeft} x2={tipLeft} y1={PAD.top} y2={baseline} className={styles.crosshair} />
                  <circle cx={tipLeft} cy={y(hovered.views)} r="4" fill={VIEWS_COLOR} className={styles.markRing} />
                  <circle cx={tipLeft} cy={y(hovered.visitors)} r="4" fill={VISITORS_COLOR} className={styles.markRing} />
                </g>
              )}

              <rect
                x={PAD.left}
                y={PAD.top}
                width={innerW}
                height={innerH}
                fill="transparent"
                onPointerMove={onPointer}
                onPointerDown={onPointer}
                onPointerLeave={() => setHover(null)}
              />
            </svg>
          )}

          {hovered && (
            <div
              className={styles.tooltip}
              style={{
                left: tipLeft,
                top: PAD.top,
                transform: tipFlip ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
              }}
            >
              <div className={styles.tooltipTitle}>{bucketLabel(hovered.t, range, true)}</div>
              <div className={styles.tooltipRow}>
                <span className={styles.tooltipKey} style={{ background: VISITORS_COLOR }} />
                <strong>{formatCount(hovered.visitors)}</strong> visitors
              </div>
              <div className={styles.tooltipRow}>
                <span className={styles.tooltipKey} style={{ background: VIEWS_COLOR }} />
                <strong>{formatCount(hovered.views)}</strong> page views
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
