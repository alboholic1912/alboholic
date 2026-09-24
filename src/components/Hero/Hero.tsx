"use client";

import { useState } from "react";
import Link from "next/link";
import ImagePlaceholder from "@/components/ImagePlaceholder/ImagePlaceholder";
import type { Story } from "@/lib/content/public";
import styles from "./Hero.module.css";

export default function Hero({ stories }: { stories: Story[] }) {
  const [active, setActive] = useState(0);
  const count = stories.length;

  if (count === 0) return null;

  const story = stories[active];

  function go(delta: number) {
    setActive((value) => (value + delta + count) % count);
  }

  return (
    <section className={styles.hero}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.media}>
          <ImagePlaceholder tone={story.imageTone} aiImage={story.aiImage} src={story.image} alt={story.title} />

          {story.credit && <span className={styles.credit}>{story.credit}</span>}

          {count > 1 && (
            <div className={styles.arrows}>
              <button type="button" aria-label="Previous featured story" onClick={() => go(-1)}>
                <ChevronIcon direction="left" />
              </button>
              <button type="button" aria-label="Next featured story" onClick={() => go(1)}>
                <ChevronIcon direction="right" />
              </button>
            </div>
          )}
        </div>

        <div className={styles.content}>
          <span className={styles.eyebrow}>{story.category}</span>
          <h1 className={styles.title}>{story.title}</h1>
          <p className={styles.excerpt}>{story.excerpt}</p>
          <Link href={`/stories/${story.slug}`} className={styles.cta}>
            Read the Story
            <ArrowIcon />
          </Link>

          {count > 1 && (
            <div className={styles.pagination} role="tablist" aria-label="Featured stories">
              {stories.map((item, index) => (
                <button
                  key={item.slug}
                  type="button"
                  role="tab"
                  aria-selected={index === active}
                  aria-label={`Show featured story ${index + 1}`}
                  className={[styles.page, index === active ? styles.pageActive : ""].join(" ")}
                  onClick={() => setActive(index)}
                >
                  {String(index + 1).padStart(2, "0")}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const d = direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6";
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
