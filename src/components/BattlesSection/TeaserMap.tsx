"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { DESKTOP_QUERY } from "@/components/BattleMap/layout";
import { HOME_BOUNDS, MAP_LABELS, MAP_STYLE } from "@/components/BattleMap/mapStyle";
import styles from "./TeaserMap.module.css";

type MapLibre = typeof import("maplibre-gl");

export interface TeaserPin {
  slug: string;
  lng: number;
  lat: number;
  /** The battle on the card beside the map, which gets the larger pin. */
  featured: boolean;
}

/** The camera keeps the country clear of the words on the left and the card on the right. See BattlesSection.module.css. */
function clearArea(container: HTMLElement) {
  if (!window.matchMedia(DESKTOP_QUERY).matches) return { top: 20, bottom: 20, left: 20, right: 20 };
  return { top: 26, bottom: 26, left: container.clientWidth * 0.36, right: container.clientWidth * 0.32 };
}

/**
 * A still view of the Battles map: the same style and labels, every battle pinned, nothing to
 * drag or tap. The panel around it is what leads to the real map.
 */
export default function TeaserMap({ pins }: { pins: TeaserPin[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // The list arrives as a new array on every render; its contents are what the map depends on.
  const pinsKey = JSON.stringify(pins);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let map: MapLibreMap | undefined;
    let cancelled = false;

    import("maplibre-gl")
      .then((module) => {
        if (cancelled) return;
        // The package is CommonJS, so depending on the bundler its exports arrive on `default` or on the namespace.
        const lib = ("default" in module ? module.default : module) as MapLibre;

        const created = new lib.Map({
          container,
          style: MAP_STYLE,
          bounds: HOME_BOUNDS,
          fitBoundsOptions: { padding: clearArea(container) },
          interactive: false,
          attributionControl: false,
        });
        map = created;
        created.addControl(new lib.AttributionControl({ compact: true }), "bottom-right");
        // On the real map the credit folds into its (i) button once the map is dragged. This one is never dragged,
        // so fold it when the map first settles, which is after MapLibre has opened it for the first time.
        created.once("idle", () => {
          const credit = container.querySelector(".maplibregl-ctrl-attrib");
          credit?.classList.remove("maplibregl-compact-show");
          credit?.removeAttribute("open");
        });
        created.on("resize", () => created.fitBounds(HOME_BOUNDS, { padding: clearArea(container), animate: false }));

        for (const place of MAP_LABELS) {
          if (place.kind === "sea") continue;
          const element = document.createElement("div");
          element.className = `${styles.label} ${place.kind === "home" ? styles.home : ""}`;
          element.textContent = place.name;
          element.setAttribute("aria-hidden", "true");
          new lib.Marker({ element }).setLngLat([place.lng, place.lat]).addTo(created);
        }

        for (const pin of JSON.parse(pinsKey) as TeaserPin[]) {
          const element = document.createElement("div");
          element.className = `${styles.pin} ${pin.featured ? styles.featured : ""}`;
          element.setAttribute("aria-hidden", "true");
          new lib.Marker({ element }).setLngLat([pin.lng, pin.lat]).addTo(created);
        }
      })
      .catch((error) => {
        // The panel reads fine without it: the words and the card carry the section.
        console.error("[map] The home page map could not be created:", error);
      });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [pinsKey]);

  return <div ref={containerRef} className={styles.map} />;
}
