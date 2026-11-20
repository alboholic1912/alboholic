"use client";

import { useEffect, useRef, useState } from "react";
import type { Battle } from "@/lib/content/public";
import { fold } from "@/lib/content/text";
import { ChevronIcon, SearchIcon } from "./icons";
import { regionOf, yearLabel } from "./layout";
import styles from "./ExploreList.module.css";

interface ExploreListProps {
  /** The battles that pass the current period filter, oldest first. */
  battles: Battle[];
  /** The active period filter, or null for all periods. */
  period: string | null;
  /** Puts the cursor in the search box, for when the list was opened from the search button. */
  focusSearch: boolean;
  onPick: (slug: string) => void;
}

/** The other way in: every battle as a plain list, for readers who would rather not hunt for pins. */
export default function ExploreList({ battles, period, focusSearch, onPick }: ExploreListProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusSearch) inputRef.current?.focus({ preventScroll: true });
  }, [focusSearch]);

  const needle = fold(query.trim());
  const matches = battles.filter(
    (battle) =>
      !needle ||
      fold(
        [battle.name, battle.location, battle.participants, battle.date, ...battle.keyPeople.map((person) => person.name)].join(" ")
      ).includes(needle)
  );

  return (
    <div className={styles.root}>
      <header className={styles.head}>
        <h2 className={styles.title}>Explore Battles</h2>
        <p className={styles.count}>
          {matches.length} {matches.length === 1 ? "battle" : "battles"}
          {period ? ` · ${period}` : ""}
        </p>
      </header>

      <label className={styles.search}>
        <SearchIcon size={17} />
        <span className="visually-hidden">Search battles</span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Search battles…"
          enterKeyHint="search"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {matches.length > 0 ? (
        <ul className={styles.list}>
          {matches.map((battle) => (
            <li key={battle.slug}>
              <button type="button" onClick={() => onPick(battle.slug)}>
                <span className={styles.text}>
                  <span className={styles.name}>{battle.name}</span>
                  <span className={styles.meta}>
                    {[yearLabel(battle.year) || battle.date, regionOf(battle.location)].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <ChevronIcon />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>{needle ? "No battles match that search." : "No battles here yet."}</p>
      )}
    </div>
  );
}
