"use client";

import { useState } from "react";
import { MAX_CAPTION, MAX_HASHTAGS, MAX_MENTIONS, captionStats } from "@/lib/instagram/types";

/** The caption box with live counts of what Instagram limits. */
export default function CaptionField({ defaultValue, className }: { defaultValue: string; className?: string }) {
  const [stats, setStats] = useState(() => captionStats(defaultValue));
  const over = (value: number, max: number) => (value > max ? { color: "var(--color-accent-bright)", fontWeight: 700 } : undefined);

  return (
    <>
      <textarea
        id="caption"
        name="caption"
        rows={12}
        defaultValue={defaultValue}
        onInput={(event) => setStats(captionStats(event.currentTarget.value))}
      />
      <span className={className}>
        <span style={over(stats.length, MAX_CAPTION)}>
          {stats.length} / {MAX_CAPTION} characters
        </span>
        {" · "}
        <span style={over(stats.hashtags, MAX_HASHTAGS)}>
          {stats.hashtags} / {MAX_HASHTAGS} hashtags
        </span>
        {" · "}
        <span style={over(stats.mentions, MAX_MENTIONS)}>
          {stats.mentions} / {MAX_MENTIONS} mentions
        </span>
        {" · "}Only the first ~125 characters show before &ldquo;more&rdquo;.
      </span>
    </>
  );
}
