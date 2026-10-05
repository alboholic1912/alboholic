"use client";

import { useState } from "react";
import StoryCard from "@/components/StoryCard/StoryCard";
import type { Story } from "@/lib/content/public";
import styles from "./StoriesBrowser.module.css";

/** A story card plus the text its keywords are searched in. */
export type SearchableStory = { story: Story; text: string };

function fold(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export default function StoriesBrowser({ stories }: { stories: SearchableStory[] }) {
  const [query, setQuery] = useState("");

  // Every keyword has to appear somewhere in the story, in any order.
  const keywords = fold(query).split(/\s+/).filter(Boolean);
  const visible = stories.filter(({ text }) => {
    const haystack = fold(text);
    return keywords.every((keyword) => haystack.includes(keyword));
  });

  return (
    <>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <SearchIcon />
          <span className="visually-hidden">Search stories</span>
          <input
            type="search"
            value={query}
            placeholder="Search stories…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      {visible.length > 0 ? (
        <div className={styles.grid}>
          {visible.map(({ story }) => (
            <StoryCard key={story.slug} story={story} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No stories match this search.</p>
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
