"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Battle } from "@/lib/content/public";
import { BATTLE_PERIODS } from "@/lib/content/types";
import BattleCard from "./BattleCard";
import BottomSheet, { type Snap } from "./BottomSheet";
import ExploreList from "./ExploreList";
import MapCanvas, { type MapHandle } from "./MapCanvas";
import { BackIcon, ListIcon, MinusIcon, PlusIcon, RecenterIcon, SearchIcon } from "./icons";
import styles from "./BattleMap.module.css";

/** The query parameter that names the open battle, so a card can be linked to and shared. */
const BATTLE_PARAM = "battle";
const RELATED_COUNT = 2;

/**
 * The Battles page: a map of pins, a card for the selected battle and a list of them all.
 * On a phone the card and list are bottom sheets over the map; on desktop, a side panel.
 */
export default function BattleMap({ battles }: { battles: Battle[] }) {
  const [period, setPeriod] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [snap, setSnap] = useState<Snap>("peek");
  const [explore, setExplore] = useState<"closed" | "list" | "search">("closed");
  const [resets, setResets] = useState(0);
  const mapRef = useRef<MapHandle>(null);

  const visible = useMemo(
    () => (period ? battles.filter((battle) => battle.period === period) : battles),
    [battles, period]
  );
  const selected = visible.find((battle) => battle.slug === selectedSlug) ?? null;
  const exploring = explore !== "closed";

  // The card keeps showing its last battle while it slides away.
  const [shown, setShown] = useState<Battle | null>(null);
  if (selected && selected !== shown) setShown(selected);

  const related = useMemo(() => {
    if (!shown) return [];
    return battles
      .filter((battle) => battle.period === shown.period && battle.slug !== shown.slug)
      .sort((a, b) => Math.abs(a.year - shown.year) - Math.abs(b.year - shown.year))
      .slice(0, RELATED_COUNT);
  }, [battles, shown]);

  function show(slug: string | null) {
    setSelectedSlug(slug);
    setSnap("peek");
    if (slug) setExplore("closed");

    const url = new URL(window.location.href);
    if (slug) url.searchParams.set(BATTLE_PARAM, slug);
    else url.searchParams.delete(BATTLE_PARAM);
    window.history.replaceState(null, "", url);
  }

  /** Closes whichever panel is on top: the list first, then the card. */
  function dismiss() {
    if (exploring) setExplore("closed");
    else if (selected) show(null);
  }

  function choosePeriod(next: string | null) {
    setPeriod(next);
    if (selected && next && selected.period !== next) show(null);
  }

  // A link such as /battles?battle=battle-of-mashkullore opens straight onto that battle.
  function openLinkedBattle() {
    const slug = new URLSearchParams(window.location.search).get(BATTLE_PARAM);
    if (slug && battles.some((battle) => battle.slug === slug)) show(slug);
  }

  const onEscape = useEffectEvent(dismiss);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const cover = exploring ? "full" : selected ? snap : "none";
  const notice =
    battles.length === 0
      ? "No battles on the map yet."
      : visible.length === 0
        ? `No ${period} battles on the map yet.`
        : null;

  return (
    <div className={styles.screen}>
      <h1 className="visually-hidden">Battles: a map of battles in Albanian history</h1>

      <header className={styles.topbar}>
        <Link href="/" className={styles.back} aria-label="Back to home">
          <BackIcon />
        </Link>
        <span className={styles.heading} aria-hidden="true">
          Battles
        </span>
        <button type="button" className={styles.roundButton} aria-label="Search battles" onClick={() => setExplore("search")}>
          <SearchIcon />
        </button>
      </header>

      <div className={styles.chips} role="group" aria-label="Filter battles by period">
        {[null, ...BATTLE_PERIODS].map((option) => (
          <button
            key={option ?? "all"}
            type="button"
            className={[styles.chip, option === period && styles.chipActive].filter(Boolean).join(" ")}
            aria-pressed={option === period}
            onClick={() => choosePeriod(option)}
          >
            {option ?? "All"}
          </button>
        ))}
        <button
          type="button"
          className={`${styles.chip} ${styles.chipSearch}`}
          aria-label="Search battles"
          onClick={() => setExplore("search")}
        >
          <SearchIcon size={16} />
          Search
        </button>
      </div>

      <div className={styles.stage} data-cover={cover}>
        <MapCanvas
          ref={mapRef}
          battles={visible}
          selected={selected}
          covered={cover !== "none"}
          frameKey={`${period ?? "all"}:${resets}`}
          anchorHome={period === null}
          onSelect={(slug) => (slug ? show(slug) : dismiss())}
          onReady={openLinkedBattle}
        />

        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}

        <div className={styles.controls}>
          <button type="button" className={styles.exploreButton} onClick={() => setExplore("list")}>
            <ListIcon size={20} />
            <span>
              <span>Explore</span> <span>Battles</span>
            </span>
          </button>
          <div className={styles.zoom}>
            <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()}>
              <PlusIcon />
            </button>
            <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()}>
              <MinusIcon />
            </button>
          </div>
          <button
            type="button"
            className={styles.roundButton}
            aria-label="Show the whole map"
            onClick={() => {
              if (selected) show(null);
              setResets((count) => count + 1);
            }}
          >
            <RecenterIcon size={20} />
          </button>
        </div>

        <BottomSheet
          open={Boolean(selected) && !exploring}
          snap={snap}
          label={shown?.name ?? "Battle"}
          contentKey={shown?.slug}
          onSnapChange={setSnap}
          onClose={() => show(null)}
        >
          {shown && (
            <BattleCard
              battle={shown}
              related={related}
              onPick={show}
              onSeeAll={() => {
                choosePeriod(shown.period);
                setExplore("list");
              }}
            />
          )}
        </BottomSheet>

        <BottomSheet
          open={exploring}
          snap="full"
          peekable={false}
          label="Explore battles"
          onSnapChange={() => {}}
          onClose={() => setExplore("closed")}
        >
          <ExploreList battles={visible} period={period} focusSearch={explore === "search"} onPick={show} />
        </BottomSheet>
      </div>
    </div>
  );
}
