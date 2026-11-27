"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Labels, Live, LiveResponse, Overview, Range, Report, ReportResponse } from "@/lib/analytics/types";
import { RANGES } from "@/lib/analytics/types";
import TrafficChart from "./TrafficChart";
import VisitorMap, { type MapPoint } from "./VisitorMap";
import Heatmap from "./Heatmap";
import BarList from "./BarList";
import SourceIcon from "./SourceIcon";
import {
  countryName,
  formatAgo,
  formatCount,
  formatDuration,
  pageLabel,
  percentChange,
  placeName,
} from "./format";
import styles from "./analytics.module.css";

const DATA_URL = "/kalaja-cabb0da6/analytics/data";
const LIVE_URL = "/kalaja-cabb0da6/analytics/live";
const REPORT_EVERY_MS = 60_000;
const LIVE_EVERY_MS = 8_000;

const RANGE_LABEL: Record<Range, string> = { "24h": "Last 24 hours", "7d": "Last 7 days", "30d": "Last 30 days" };
const RANGE_SHORT: Record<Range, string> = { "24h": "24 hours", "7d": "7 days", "30d": "30 days" };
const PREVIOUS: Record<Range, string> = { "24h": "the 24 hours before", "7d": "the 7 days before", "30d": "the 30 days before" };

/** Fixed per device, never by rank, so a colour always means the same thing. Checked with the dataviz validator. */
const DEVICE_COLORS: Record<string, string> = {
  Mobile: "#3987e5",
  Desktop: "#d95926",
  Tablet: "#199e70",
  Unknown: "#5b5350",
};

type ReportData = { overview: Overview; report: Report; labels: Labels };
type LiveData = { live: Live; labels: Labels };

function viewerTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Fetches JSON from a Studio route; a signed-out session comes back as the login page instead. */
async function getJson<T>(url: string, signal: AbortSignal): Promise<T | { error: string }> {
  const response = await fetch(url, { cache: "no-store", signal });
  if (response.redirected && response.url.includes("/login")) {
    return { error: "Your session has ended. Sign in again to see the numbers." };
  }
  return (await response.json()) as T | { error: string };
}

function pageHref(path: string, battle?: string | null) {
  return battle ? `/battles?battle=${encodeURIComponent(battle)}` : path;
}

function Delta({
  current,
  previous,
  upIsGood = true,
  points = false,
}: {
  current: number;
  previous: number;
  upIsGood?: boolean;
  /** Compare as percentage points (for rates) instead of percent change. */
  points?: boolean;
}) {
  const change = points ? Math.round(current - previous) : percentChange(current, previous);
  if (change === null) return <span className={styles.deltaFlat}>New</span>;
  if (change === 0) return <span className={styles.deltaFlat}>No change</span>;
  const good = change > 0 === upIsGood;
  return (
    <span className={good ? styles.deltaGood : styles.deltaBad}>
      <span aria-hidden="true">{change > 0 ? "▲" : "▼"}</span>
      {Math.abs(change)}
      {points ? " pts" : "%"}
      <span className={styles.srOnly}>{change > 0 ? " up" : " down"}</span>
    </span>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const total = values.reduce((sum, v) => sum + v, 0);
  return (
    <div className={styles.spark} role="img" aria-label={`${total} page views in the last 30 minutes`}>
      {values.map((value, index) => (
        <span
          key={index}
          className={index === values.length - 1 ? styles.sparkBarNow : styles.sparkBar}
          style={{ height: `${Math.max(value === 0 ? 0 : 12, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function Panel({
  title,
  hint,
  actions,
  className,
  children,
}: {
  title: string;
  hint?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${styles.panel} ${className ?? ""}`}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>{title}</h2>
          {hint && <p className={styles.panelHint}>{hint}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function DeviceSplit({ devices, total }: { devices: Report["devices"]; total: number }) {
  if (devices.length === 0 || total === 0) return <p className={styles.empty}>No visits in this range yet.</p>;
  const order = ["Mobile", "Desktop", "Tablet", "Unknown"];
  const parts = [...devices].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  const sum = parts.reduce((s, d) => s + d.visitors, 0);
  return (
    <div className={styles.deviceBlock}>
      <div
        className={styles.segmented}
        role="img"
        aria-label={parts.map((d) => `${d.name} ${Math.round((d.visitors / sum) * 100)}%`).join(", ")}
      >
        {parts.map((d) => {
          const share = Math.round((d.visitors / sum) * 100);
          return (
            <span
              key={d.name}
              className={styles.segment}
              style={{ flexGrow: d.visitors, background: DEVICE_COLORS[d.name] ?? DEVICE_COLORS.Unknown }}
              title={`${d.name}: ${d.visitors} visitors (${share}%)`}
            >
              {share >= 14 ? `${share}%` : ""}
            </span>
          );
        })}
      </div>
      <ul className={styles.deviceLegend}>
        {parts.map((d) => (
          <li key={d.name}>
            <span className={styles.swatch} style={{ background: DEVICE_COLORS[d.name] ?? DEVICE_COLORS.Unknown }} />
            {d.name}
            <span className={styles.deviceCount}>{formatCount(d.visitors)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Skeleton() {
  return (
    <div className={styles.skeletonGrid} aria-busy="true" aria-label="Loading analytics">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={`${styles.skeleton} ${styles.skeletonCard}`} />
      ))}
      <div className={`${styles.skeleton} ${styles.skeletonWide}`} />
      <div className={`${styles.skeleton} ${styles.skeletonWide}`} />
    </div>
  );
}

/**
 * The Studio's Analytics page: visitors right now and over the last day, week and month,
 * where they are and came from, what they read and for how long. Numbers come from our own
 * cookieless counter (supabase/analytics.sql); the page refreshes itself while open.
 */
export default function AnalyticsDashboard() {
  const [range, setRange] = useState<Range>("7d");
  const [data, setData] = useState<ReportData | null>(null);
  const [live, setLive] = useState<LiveData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);
  const [mapMode, setMapMode] = useState<"live" | "range">("range");
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const url = `${DATA_URL}?range=${range}&tz=${encodeURIComponent(viewerTimeZone())}`;
    const load = async () => {
      try {
        const body = await getJson<ReportResponse>(url, controller.signal);
        if ("error" in body) {
          setError(body.error);
        } else {
          setData(body);
          setError(null);
          setUpdatedAt(Date.now());
        }
      } catch {
        if (!controller.signal.aborted) setError("Couldn't load the numbers. Check the connection and try again.");
      } finally {
        if (!controller.signal.aborted) setPending(false);
      }
    };
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, REPORT_EVERY_MS);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [range]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const body = await getJson<LiveResponse>(LIVE_URL, controller.signal);
        if (!("error" in body)) setLive(body);
      } catch {
        // The next round tries again; the report panel shows connection problems.
      }
    };
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, LIVE_EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const chooseRange = (next: Range) => {
    if (next === range) return;
    setPending(true);
    setRange(next);
  };

  const overview = data?.overview;
  const report = data?.report;
  const labels: Labels = { ...(data?.labels ?? {}), ...(live?.labels ?? {}) };
  const online = live?.live.online ?? [];
  const liveCount = live ? online.length : (overview?.live ?? 0);

  const rangePoints: MapPoint[] = (report?.cities ?? []).map((c) => ({
    key: `${c.name}|${c.country}`,
    lat: c.lat,
    lng: c.lng,
    weight: c.visitors,
    title: placeName(c.name, c.country),
    detail: `${c.visitors} visitor${c.visitors === 1 ? "" : "s"} · ${c.views} page view${c.views === 1 ? "" : "s"}`,
  }));
  const livePoints: MapPoint[] = online.flatMap((v) =>
    v.lat === null || v.lng === null
      ? []
      : [
          {
            key: v.id,
            lat: v.lat,
            lng: v.lng,
            weight: 1,
            title: placeName(v.city, v.country),
            detail: `Reading ${pageLabel(labels, v.path, v.battle)} · from ${v.source}`,
          },
        ],
  );

  const totals = report?.totals;
  const prev = report?.prevTotals;

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Studio · Audience</p>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>
            Anonymous visits counted by our own site: no cookies, no third parties.
            {report ? ` Days and hours in ${report.tz.replace(/_/g, " ")}.` : ""}
          </p>
        </div>
        <div className={liveCount > 0 ? styles.livePill : styles.livePillIdle} aria-live="polite">
          <span className={styles.pulse} aria-hidden="true" />
          <strong>{liveCount}</strong> {liveCount === 1 ? "person" : "people"} on the site now
        </div>
      </header>

      <div className={styles.filterRow}>
        <div className={styles.rangeTabs} role="group" aria-label="Range">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              className={r === range ? styles.rangeTabActive : styles.rangeTab}
              aria-pressed={r === range}
              onClick={() => chooseRange(r)}
            >
              {RANGE_SHORT[r]}
            </button>
          ))}
        </div>
        <span className={styles.updated}>
          {pending && data ? <span className={styles.spinner} aria-hidden="true" /> : null}
          {updatedAt ? `Updated ${formatAgo(new Date(updatedAt).toISOString(), now)}` : pending ? "Loading…" : ""}
        </span>
      </div>

      {error && (
        <div className={styles.notice} role="alert">
          {error}
        </div>
      )}

      {!data ? (
        !error && <Skeleton />
      ) : (
        <div className={pending ? styles.contentPending : styles.content}>
          <div className={styles.overviewGrid}>
            <div className={`${styles.statCard} ${styles.statLive}`}>
              <div className={styles.statLabelRow}>
                <span className={styles.pulseSmall} aria-hidden="true" />
                Live now
              </div>
              <div className={styles.statValue}>{formatCount(liveCount)}</div>
              <div className={styles.statSub}>
                {liveCount === 1 ? "visitor" : "visitors"} in the last minute
              </div>
              {live && <Sparkline values={live.live.perMinute} />}
              <div className={styles.statFoot}>Page views per minute, last 30 min</div>
            </div>

            {RANGES.map((r) => {
              const c = overview![r];
              return (
                <button
                  key={r}
                  type="button"
                  className={`${styles.statCard} ${r === range ? styles.statCardActive : ""}`}
                  onClick={() => chooseRange(r)}
                  aria-pressed={r === range}
                >
                  <div className={styles.statLabelRow}>{RANGE_LABEL[r]}</div>
                  <div className={styles.statValue}>{formatCount(c.visitors)}</div>
                  <div className={styles.statSub}>
                    visitors · {formatCount(c.views)} page views
                  </div>
                  <div className={styles.statFoot}>
                    <Delta current={c.visitors} previous={c.prevVisitors} /> vs {PREVIOUS[r]}
                  </div>
                </button>
              );
            })}
          </div>

          <Panel
            title="Traffic"
            hint={`${RANGE_LABEL[range]}, by ${range === "24h" ? "hour" : "day"}`}
            className={styles.span12}
            actions={
              totals &&
              prev && (
                <dl className={styles.kpis}>
                  <div>
                    <dt>Avg. visit</dt>
                    <dd>{formatDuration(totals.avgVisitSeconds)}</dd>
                    <Delta current={totals.avgVisitSeconds} previous={prev.avgVisitSeconds} />
                  </div>
                  <div>
                    <dt>Pages per visit</dt>
                    <dd>{totals.viewsPerVisitor.toFixed(1)}</dd>
                    <Delta current={totals.viewsPerVisitor} previous={prev.viewsPerVisitor} />
                  </div>
                  <div>
                    <dt>Left after one page</dt>
                    <dd>{totals.bounceRate}%</dd>
                    <Delta current={totals.bounceRate} previous={prev.bounceRate} upIsGood={false} points />
                  </div>
                </dl>
              )
            }
          >
            <TrafficChart series={report!.series} range={range} />
          </Panel>

          <Panel
            title="Where visitors are"
            hint={
              mapMode === "live"
                ? "Everyone on the site in the last minute, by town."
                : `${RANGE_LABEL[range]}. Bigger dots, more visitors. Towns are approximate.`
            }
            className={styles.span12}
            actions={
              <div className={styles.miniTabs} role="group" aria-label="Map shows">
                <button
                  type="button"
                  className={mapMode === "live" ? styles.miniTabActive : styles.miniTab}
                  aria-pressed={mapMode === "live"}
                  onClick={() => setMapMode("live")}
                >
                  <span className={styles.pulseSmall} aria-hidden="true" /> Live · {liveCount}
                </button>
                <button
                  type="button"
                  className={mapMode === "range" ? styles.miniTabActive : styles.miniTab}
                  aria-pressed={mapMode === "range"}
                  onClick={() => setMapMode("range")}
                >
                  {RANGE_SHORT[range]}
                </button>
              </div>
            }
          >
            <div className={styles.mapLayout}>
              <VisitorMap points={mapMode === "live" ? livePoints : rangePoints} mode={mapMode} />
              <div className={styles.mapSide}>
                {mapMode === "live" ? (
                  online.length === 0 ? (
                    <p className={styles.empty}>No one is on the site right now. Dots appear here as people arrive.</p>
                  ) : (
                    <BarList
                      items={Object.values(
                        online.reduce<Record<string, { code: string | null; count: number }>>((acc, v) => {
                          const key = v.country ?? "??";
                          acc[key] = { code: v.country, count: (acc[key]?.count ?? 0) + 1 };
                          return acc;
                        }, {}),
                      )
                        .sort((a, b) => b.count - a.count)
                        .map((c) => ({
                          key: c.code ?? "unknown",
                          label: countryName(c.code),
                          icon: <span className={styles.countryCode}>{c.code ?? "?"}</span>,
                          value: c.count,
                        }))}
                    />
                  )
                ) : (
                  <>
                    <h3 className={styles.subTitle}>Countries</h3>
                    <BarList
                      items={report!.countries.slice(0, 8).map((c) => ({
                        key: c.code,
                        label: countryName(c.code),
                        icon: <span className={styles.countryCode}>{c.code}</span>,
                        value: c.visitors,
                      }))}
                      total={totals?.visitors}
                      empty="No locations yet. They're added by the live site's network, so local test visits have none."
                    />
                    {report!.unknownLocation > 0 && (
                      <p className={styles.footnote}>
                        {report!.unknownLocation} visitor{report!.unknownLocation === 1 ? "" : "s"} without a known location.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </Panel>

          <Panel title="Right now" hint="Who's reading, and for how long so far." className={styles.span5}>
            {online.length === 0 ? (
              <div className={styles.quiet}>
                <span className={styles.quietDot} aria-hidden="true" />
                <p>No one is on the site this minute.</p>
              </div>
            ) : (
              <ul className={styles.onlineList}>
                {[...online]
                  .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
                  .map((v) => {
                    const sinceSeen = Math.max(0, (now - new Date(v.lastSeen).getTime()) / 1000);
                    return (
                      <li key={v.id} className={styles.onlineRow}>
                        <span className={styles.onlineDot} aria-hidden="true" />
                        <div className={styles.onlineMain}>
                          <a href={pageHref(v.path, v.battle)} target="_blank" rel="noreferrer" className={styles.onlinePage}>
                            {pageLabel(labels, v.path, v.battle)}
                          </a>
                          <div className={styles.onlineMeta}>
                            {placeName(v.city, v.country)} · <SourceIcon name={v.source} /> {v.source} · {v.device ?? "Unknown device"}
                          </div>
                        </div>
                        <div className={styles.onlineTime}>
                          <strong>{formatDuration(v.seconds + Math.min(sinceSeen, 20))}</strong>
                          <span>{v.scroll}% read</span>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </Panel>

          <Panel title="Latest page views" hint="As they happen. Time and depth fill in while the page stays open." className={styles.span7}>
            {(live?.live.recent ?? []).length === 0 ? (
              <p className={styles.empty}>No page views recorded yet.</p>
            ) : (
              <ul className={styles.feed}>
                {live!.live.recent.map((v) => {
                  const active = now - new Date(v.lastSeen).getTime() < 60_000;
                  return (
                    <li key={v.id} className={styles.feedRow}>
                      <span className={active ? styles.feedDotActive : styles.feedDot} aria-hidden="true" />
                      <span className={styles.feedWhen}>{formatAgo(v.at, now)}</span>
                      <div className={styles.feedMain}>
                        <a href={pageHref(v.path, v.battle)} target="_blank" rel="noreferrer" className={styles.feedPage}>
                          {pageLabel(labels, v.path, v.battle)}
                        </a>
                        <div className={styles.feedMeta}>
                          {placeName(v.city, v.country)} · {v.source} · {v.device ?? "?"}
                          {v.browser ? `, ${v.browser}` : ""}
                        </div>
                      </div>
                      <div className={styles.feedStats}>
                        <span>{formatDuration(v.seconds)}</span>
                        <span className={styles.depth} title={`Scrolled ${v.scroll}% of the page`}>
                          <span style={{ width: `${v.scroll}%` }} />
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Top pages" hint={`${RANGE_LABEL[range]}. Read depth is how far down the page people got.`} className={styles.span7}>
            {report!.pages.length === 0 ? (
              <p className={styles.empty}>No page views in this range yet.</p>
            ) : (
              <div className={styles.tableWide}>
                <table className={styles.pagesTable}>
                  <thead>
                    <tr>
                      <th scope="col">Page</th>
                      <th scope="col">Visitors</th>
                      <th scope="col">Views</th>
                      <th scope="col">Avg. time</th>
                      <th scope="col">Read depth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report!.pages.map((p) => (
                      <tr key={p.path}>
                        <td>
                          <a href={p.path} target="_blank" rel="noreferrer" className={styles.pageName}>
                            {pageLabel(labels, p.path)}
                          </a>
                          {labels[p.path] && <span className={styles.pagePath}>{p.path}</span>}
                        </td>
                        <td>{formatCount(p.visitors)}</td>
                        <td>{formatCount(p.views)}</td>
                        <td>{formatDuration(p.avgSeconds)}</td>
                        <td>
                          <span className={styles.depthCell}>
                            <span className={styles.depth}>
                              <span style={{ width: `${p.avgScroll}%` }} />
                            </span>
                            {p.avgScroll}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Where they came from" hint="By the first page of each visit." className={styles.span5}>
            <BarList
              items={report!.sources.map((s) => ({
                key: s.name,
                label: s.name,
                icon: <SourceIcon name={s.name} />,
                value: s.visitors,
              }))}
              total={totals?.visitors}
              empty="No visits in this range yet."
            />
            {report!.campaigns.length > 0 && (
              <>
                <h3 className={styles.subTitle}>Campaigns</h3>
                <BarList
                  items={report!.campaigns.map((c) => ({ key: c.name, label: c.name, value: c.visitors }))}
                  color={DEVICE_COLORS.Mobile}
                />
              </>
            )}
          </Panel>

          <Panel title="Devices" hint="Visitors by kind of device." className={styles.span4}>
            <DeviceSplit devices={report!.devices} total={totals?.visitors ?? 0} />
            <h3 className={styles.subTitle}>Browsers</h3>
            <BarList
              items={report!.browsers.map((b) => ({ key: b.name, label: b.name, value: b.visitors }))}
              total={totals?.visitors}
              color={DEVICE_COLORS.Mobile}
            />
          </Panel>

          <Panel title="Systems" hint="Phone and computer operating systems." className={styles.span4}>
            <BarList
              items={report!.os.map((o) => ({ key: o.name, label: o.name, value: o.visitors }))}
              total={totals?.visitors}
              color={DEVICE_COLORS.Desktop}
              empty="No visits in this range yet."
            />
          </Panel>

          <Panel title="Towns" hint="Approximate, from the visitor's network." className={styles.span4}>
            <BarList
              items={report!.cities.slice(0, 8).map((c) => ({
                key: `${c.name}|${c.country}`,
                label: c.name,
                sublabel: countryName(c.country),
                value: c.visitors,
              }))}
              total={totals?.visitors}
              color={DEVICE_COLORS.Tablet}
              empty="No towns yet. They're added by the live site's network."
            />
          </Panel>

          <Panel title="When people read" hint={`Page views by day and hour, ${RANGE_LABEL[range].toLowerCase()}.`} className={styles.span7}>
            <Heatmap heat={report!.heat} />
          </Panel>

          <Panel title="First pages" hint="Where visits begin." className={styles.span5}>
            <BarList
              items={report!.landing.map((l) => ({
                key: l.path,
                label: pageLabel(labels, l.path),
                sublabel: labels[l.path] ? l.path : undefined,
                value: l.visitors,
              }))}
              total={totals?.visitors}
              empty="No visits in this range yet."
            />
            {report!.battles.length > 0 && (
              <>
                <h3 className={styles.subTitle}>Battles opened on the map</h3>
                <BarList
                  items={report!.battles.map((b) => ({
                    key: b.slug,
                    label: pageLabel(labels, "/battles", b.slug),
                    value: b.views,
                  }))}
                  color="#b58cff"
                />
              </>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
