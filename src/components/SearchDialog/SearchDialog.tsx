"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { searchEntries, type SearchEntry, type SearchKind } from "@/lib/search";
import styles from "./SearchDialog.module.css";

const FILTERS: { kind: SearchKind | null; label: string }[] = [
  { kind: null, label: "All" },
  { kind: "story", label: "Stories" },
  { kind: "person", label: "People" },
  { kind: "battle", label: "Battles" },
];

const KIND_LABELS: Record<SearchKind, string> = { story: "Story", person: "Person", battle: "Battle" };

const SUGGESTIONS = ["Skanderbeg", "Kosovo", "Besa", "1912", "Ottoman"];

// The index is the same for every open of the dialog, so it is fetched once per visit.
let indexPromise: Promise<SearchEntry[]> | null = null;
function loadIndex(): Promise<SearchEntry[]> {
  indexPromise ??= fetch("/search-index")
    .then((response) => {
      if (!response.ok) throw new Error(`Search index: ${response.status}`);
      return response.json() as Promise<SearchEntry[]>;
    })
    .catch((error) => {
      indexPromise = null; // Let the next open try again.
      throw error;
    });
  return indexPromise;
}

/**
 * The site-wide search, opened from the header. Looks through every published story,
 * person and battle as you type. Arrow keys move through the results, Enter opens one.
 */
export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<SearchKind | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.select();
      setFailed(false);
      loadIndex().then(setEntries, () => setFailed(true));
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const results = useMemo(() => {
    if (!entries) return [];
    const scoped = kind ? entries.filter((entry) => entry.kind === kind) : entries;
    return searchEntries(scoped, query);
  }, [entries, query, kind]);

  // Keep the highlighted result in view while moving through the list with the keyboard.
  useEffect(() => {
    dialogRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function go(href: string) {
    onClose();
    // The map reads ?battle= when it loads, so another battle on the open map needs a fresh load.
    if (pathname === "/battles" && href.startsWith("/battles")) window.location.assign(href);
    else router.push(href);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setActive((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      go(results[active].href);
    }
  }

  const trimmed = query.trim();

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label="Search Alboholic"
      onClose={onClose}
      // A click on the dimmed backdrop lands on the dialog element itself.
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className={styles.panel} onKeyDown={handleKeyDown}>
        <div className={styles.inputRow}>
          <SearchIcon />
          <input
            ref={inputRef}
            className={styles.input}
            type="search"
            placeholder="Search stories, people and battles"
            aria-label="Search"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
          />
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close search">
            <span className={styles.escKey}>Esc</span>
            <CloseIcon />
          </button>
        </div>

        <div className={styles.filters} role="group" aria-label="Show">
          {FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              className={styles.filter}
              aria-pressed={kind === filter.kind}
              onClick={() => {
                setKind(filter.kind);
                setActive(0);
                inputRef.current?.focus();
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className={styles.body}>
          {failed ? (
            <p className={styles.message}>Search isn&rsquo;t available right now. Please try again in a moment.</p>
          ) : !entries ? (
            <p className={styles.message}>Loading…</p>
          ) : !trimmed ? (
            <div className={styles.message}>
              <p>Try searching for</p>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className={styles.suggestion}
                    onClick={() => {
                      setQuery(suggestion);
                      setActive(0);
                      inputRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className={styles.message}>
              Nothing found for &ldquo;{trimmed}&rdquo;{kind ? " here. Try All." : "."}
            </p>
          ) : (
            <ul className={styles.results} role="listbox" aria-label="Results">
              {results.map((result, index) => (
                <li key={`${result.kind}:${result.href}`} role="option" aria-selected={index === active}>
                  <a
                    href={result.href}
                    data-index={index}
                    className={styles.result}
                    onMouseMove={() => setActive(index)}
                    onClick={(event) => {
                      if (event.metaKey || event.ctrlKey || event.shiftKey) return; // Open in a new tab as usual.
                      event.preventDefault();
                      go(result.href);
                    }}
                  >
                    <span className={[styles.thumb, result.kind === "person" && styles.person].filter(Boolean).join(" ")}>
                      {result.image ? (
                        <Image src={result.image} alt="" width={48} height={48} sizes="48px" />
                      ) : (
                        <KindIcon kind={result.kind} />
                      )}
                    </span>
                    <span className={styles.text}>
                      <span className={styles.titleRow}>
                        <span className={styles.title}>{result.title}</span>
                        <span className={styles.badge}>{KIND_LABELS[result.kind]}</span>
                      </span>
                      {result.meta && <span className={styles.meta}>{result.meta}</span>}
                      {result.snippet && <span className={styles.snippet}>{result.snippet}</span>}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.searchIcon}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.closeIcon}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function KindIcon({ kind }: { kind: SearchKind }) {
  const paths: Record<SearchKind, string> = {
    story: "M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5zM4 21h14",
    person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
    battle: "M5 5l14 14M19 5L5 19M5 5v4M5 5h4M19 5v4M19 5h-4",
  };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={paths[kind]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
