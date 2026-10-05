"use client";

import { useState } from "react";
import PersonCard from "@/components/PersonCard/PersonCard";
import type { Person } from "@/lib/content/public";
import styles from "./PeopleBrowser.module.css";

const MODERN_ERA_FROM = 1900;

/** The years mentioned in a person's "Years" text, e.g. "1962 – 1997" gives [1962, 1997]. */
function yearsOf(person: Person): number[] {
  return (person.era.match(/\d{3,4}/g) ?? []).map(Number);
}

const FILTERS: { label: string; matches: (person: Person) => boolean }[] = [
  { label: "All", matches: () => true },
  { label: "Freedom Fighters", matches: (person) => person.category === "Freedom Fighter" },
  { label: "Leaders", matches: (person) => person.category === "Leader" },
  { label: "Scholars", matches: (person) => person.category === "Scholar" },
  { label: "Cultural Figures", matches: (person) => person.category === "Cultural Figure" },
  { label: "Modern Era", matches: (person) => yearsOf(person).some((year) => year >= MODERN_ERA_FROM) },
];

const SORTS: { label: string; compare: (a: Person, b: Person) => number }[] = [
  { label: "Name A–Z", compare: (a, b) => a.name.localeCompare(b.name) },
  { label: "Earliest first", compare: (a, b) => (yearsOf(a)[0] ?? Infinity) - (yearsOf(b)[0] ?? Infinity) },
  { label: "Latest first", compare: (a, b) => (yearsOf(b)[0] ?? -Infinity) - (yearsOf(a)[0] ?? -Infinity) },
];

function fold(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export default function PeopleBrowser({ people }: { people: Person[] }) {
  const [filter, setFilter] = useState(0);
  const [sort, setSort] = useState(0);
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const needle = fold(query.trim());
  const visible = people
    .filter(FILTERS[filter].matches)
    .filter(
      (person) =>
        !needle ||
        fold([person.name, person.category, person.role, person.knownFor, person.birthplace].filter(Boolean).join(" ")).includes(needle)
    )
    .sort(SORTS[sort].compare);

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.filters} role="group" aria-label="Filter people">
          {FILTERS.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={[styles.filter, index === filter && styles.filterActive].filter(Boolean).join(" ")}
              aria-pressed={index === filter}
              onClick={() => setFilter(index)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={styles.controls}>
          <label className={styles.search}>
            <SearchIcon />
            <span className="visually-hidden">Search people</span>
            <input
              type="search"
              value={query}
              placeholder="Search people…"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <select
            className={styles.sort}
            aria-label="Sort people"
            value={sort}
            onChange={(event) => setSort(Number(event.target.value))}
          >
            {SORTS.map((item, index) => (
              <option key={item.label} value={index}>
                {item.label}
              </option>
            ))}
          </select>

          <div className={styles.layouts} role="group" aria-label="Layout">
            <button
              type="button"
              className={layout === "grid" ? styles.layoutActive : undefined}
              aria-label="Grid view"
              aria-pressed={layout === "grid"}
              onClick={() => setLayout("grid")}
            >
              <GridIcon />
            </button>
            <button
              type="button"
              className={layout === "list" ? styles.layoutActive : undefined}
              aria-label="List view"
              aria-pressed={layout === "list"}
              onClick={() => setLayout("list")}
            >
              <ListIcon />
            </button>
          </div>
        </div>
      </div>

      {visible.length > 0 ? (
        <div className={layout === "grid" ? styles.grid : styles.list}>
          {visible.map((person) => (
            <PersonCard key={person.slug} person={person} layout={layout} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No people match this view yet.</p>
      )}
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
