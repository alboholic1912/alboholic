"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { TeaserPin } from "./TeaserMap";

// MapLibre is large, so the map and its stylesheet stay out of the page until the panel is near.
const TeaserMap = dynamic(() => import("./TeaserMap"), { ssr: false });

/** Holds the place of the home page's map, and loads it as the reader scrolls toward it. */
export default function MapTeaser({ pins, className }: { pins: TeaserPin[]; className?: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={stageRef} className={className}>
      {near && <TeaserMap pins={pins} />}
    </div>
  );
}
