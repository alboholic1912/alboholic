"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { runImageGeneration } from "@/lib/content/imageActions";
import styles from "./FeaturedImage.module.css";

type Props = {
  jobId: string;
  status: "pending" | "generating";
  /** When the job was queued or claimed, so the timer survives a reload. */
  since: string;
  shape: "wide" | "square";
  caption: string;
};

const REFRESH_MS = 8000;

/**
 * Starts a queued image as soon as the edit page shows it, then reloads the page data when it
 * finishes. If the image is already running (another tab, or a reload mid-run), it just keeps
 * checking until it's done.
 */
export default function ImageJobRunner({ jobId, status, since, shape, caption }: Props) {
  const router = useRouter();
  const started = useRef(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status === "pending") {
      if (started.current) return;
      started.current = true;
      runImageGeneration(jobId)
        .catch((err) => console.error("[ImageJobRunner] Image generation failed:", err))
        .finally(() => router.refresh());
      return;
    }

    const timer = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [jobId, status, router]);

  useEffect(() => {
    const start = new Date(since).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [since]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = String(elapsed % 60).padStart(2, "0");

  return (
    <div className={`${styles.stage} ${shape === "square" ? styles.dropSquare : styles.dropWide} ${styles.stageRunning}`} role="status">
      <div className={styles.stageInner}>
        <span className={styles.spinner} aria-hidden="true" />
        <span className={styles.stageTitle}>Generating the image…</span>
        <span className={styles.stageMeta}>
          {caption} · {minutes}:{seconds}
        </span>
        <span className={styles.stageHint}>Usually under two minutes. You can keep editing below.</span>
      </div>
    </div>
  );
}
