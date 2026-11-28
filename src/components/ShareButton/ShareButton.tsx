"use client";

import { useEffect, useRef, useState } from "react";
import { copyText } from "./copyText";
import ShareSheet from "./ShareSheet";
import styles from "./ShareButton.module.css";

/**
 * What the Instagram pictures are of: see src/app/instagram-story (the Story) and
 * src/app/instagram-picture (posts and reels).
 */
export type StoryCard = { kind: "story" | "person" | "battle"; slug: string };

/**
 * Shares a page. With `card`, it opens the share options: a ready-made Instagram Story
 * picture of the page, or its link. Without, phones and tablets get their own share menu and
 * computers copy the link, saying so for a moment.
 */
export default function ShareButton({
  path,
  title,
  card,
  className,
}: {
  /** The page to share, e.g. "/stories/besa". */
  path: string;
  title: string;
  card?: StoryCard;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  // The sheet is drawn on the first tap and kept, so it can slide away and come back.
  const [sheetMade, setSheetMade] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function share() {
    if (card) {
      setSheetMade(true);
      setSheetOpen(true);
      return;
    }

    const url = new URL(path, window.location.origin).toString();
    const touch = window.matchMedia("(pointer: coarse)").matches;

    if (touch && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Closing the share menu isn't a failure; anything else falls back to copying.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    if (await copyText(url)) {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      <button
        type="button"
        className={[styles.button, className].filter(Boolean).join(" ")}
        aria-haspopup={card ? "dialog" : undefined}
        onClick={share}
      >
        {copied ? <CheckIcon /> : <ShareIcon />}
        <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
      </button>

      {card && sheetMade && (
        <ShareSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          url={new URL(path, window.location.origin).toString()}
          title={title}
          pictureSrcs={{
            story: `/instagram-story/${card.kind}/${encodeURIComponent(card.slug)}`,
            post: `/instagram-picture/post/${card.kind}/${encodeURIComponent(card.slug)}`,
            reel: `/instagram-picture/reel/${card.kind}/${encodeURIComponent(card.slug)}`,
          }}
          fileName={`alboholic-${card.slug}`}
        />
      )}
    </>
  );
}

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
