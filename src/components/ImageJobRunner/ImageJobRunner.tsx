"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { runImageGeneration } from "@/lib/content/imageActions";

type Props = {
  jobId: string;
  status: "pending" | "generating";
  className?: string;
};

const REFRESH_MS = 8000;

/**
 * Starts a queued image as soon as the edit page shows it, then reloads the page data when it
 * finishes. If the image is already running (another tab, or a reload mid-run), it just keeps
 * checking until it's done.
 */
export default function ImageJobRunner({ jobId, status, className }: Props) {
  const router = useRouter();
  const started = useRef(false);

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

  return (
    <p className={className} role="status">
      Generating the image with OpenAI… This usually takes under two minutes. You can keep editing below; save your
      changes before leaving the page.
    </p>
  );
}
