"use client";

import { useEffect, useEffectEvent, useImperativeHandle, useRef, useState, type Ref } from "react";
import type { LngLatBoundsLike, Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Battle } from "@/lib/content/public";
import { isDesktop, PANEL_SPACE, PEEK_FRACTION, placeOf, DESKTOP_QUERY } from "./layout";
import { HOME_BOUNDS, MAP_LABELS, MAP_STYLE, MAX_BOUNDS } from "./mapStyle";
import styles from "./MapCanvas.module.css";

type MapLibre = typeof import("maplibre-gl");

/** How close the map moves in on a selected battle, unless the reader is already closer. */
const FOCUS_ZOOM = 8.6;
/** Framing a set of battles never zooms in further than this, so one lone pin keeps its surroundings. */
const FRAME_MAX_ZOOM = 8.4;
/** A press that travels further than this is a pan that happened to start on a pin, not a tap. */
const TAP_SLOP = 6;

export interface MapHandle {
  zoomIn(): void;
  zoomOut(): void;
}

interface MapCanvasProps {
  ref: Ref<MapHandle>;
  /** The battles to pin: those that pass the current filter. */
  battles: Battle[];
  selected: Battle | null;
  /** Whether a sheet or panel is open over part of the map. */
  covered: boolean;
  /** Changes whenever the map should move to show all of `battles` again. */
  frameKey: string;
  /** Keep Albania in view when framing, rather than fitting the battles alone. */
  anchorHome: boolean;
  onSelect: (slug: string | null) => void;
  onReady: () => void;
}

/** The part of the map left visible once a sheet or panel is open, as camera padding. */
function visibleArea(map: MapLibreMap, covered: boolean): { top: number; bottom: number; left: number; right: number } {
  const { clientWidth, clientHeight } = map.getContainer();
  if (isDesktop()) {
    return { top: 88, bottom: 48, left: 48, right: covered ? Math.min(PANEL_SPACE, clientWidth / 2) + 32 : 48 };
  }
  return { top: 32, left: 32, right: 32, bottom: covered ? Math.round(clientHeight * PEEK_FRACTION) + 24 : 32 };
}

function boundsOf(battles: Battle[], anchorHome: boolean): LngLatBoundsLike {
  const [[west, south], [east, north]] = HOME_BOUNDS as [[number, number], [number, number]];
  const lngs = battles.map((battle) => battle.lng);
  const lats = battles.map((battle) => battle.lat);
  if (anchorHome || battles.length === 0) {
    lngs.push(west, east);
    lats.push(south, north);
  }
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

function createPin(battle: Battle): HTMLButtonElement {
  const pin = document.createElement("button");
  pin.type = "button";
  pin.className = styles.pin;
  pin.setAttribute("aria-label", [battle.name, battle.date].filter(Boolean).join(", "));
  pin.setAttribute("aria-pressed", "false");

  const dot = document.createElement("span");
  dot.className = styles.dot;

  const label = document.createElement("span");
  label.className = styles.pinLabel;
  label.textContent = placeOf(battle.location) || battle.name;

  pin.append(dot, label);
  return pin;
}

export default function MapCanvas({
  ref,
  battles,
  selected,
  covered,
  frameKey,
  anchorHome,
  onSelect,
  onReady,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pins = useRef(new Map<string, { marker: Marker; element: HTMLButtonElement }>());
  const framedOnce = useRef(false);
  const [engine, setEngine] = useState<{ lib: MapLibre; map: MapLibreMap } | null>(null);
  const [failed, setFailed] = useState(false);

  const select = useEffectEvent(onSelect);
  const ready = useEffectEvent(onReady);

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => engine?.map.zoomIn(),
      zoomOut: () => engine?.map.zoomOut(),
    }),
    [engine]
  );

  // Create the map once. MapLibre is large, so it is loaded only here, after the page is interactive.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const registry = pins.current;
    const cleanups: (() => void)[] = [];
    let cancelled = false;

    import("maplibre-gl")
      .then((module) => {
        if (cancelled) return;
        // The package is CommonJS, so depending on the bundler its exports arrive on `default` or on the namespace.
        const lib = ("default" in module ? module.default : module) as MapLibre;

        const map = new lib.Map({
          container,
          style: MAP_STYLE,
          bounds: HOME_BOUNDS,
          maxBounds: MAX_BOUNDS,
          minZoom: 4.5,
          maxZoom: 13,
          // North stays up and the map stays flat: one less thing to get lost in on a phone.
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          attributionControl: false,
        });
        cleanups.push(() => map.remove());
        map.touchZoomRotate.disableRotation();
        map.keyboard.disableRotation();

        for (const place of MAP_LABELS) {
          const element = document.createElement("div");
          element.className = `${styles.label} ${styles[place.kind]}`;
          element.textContent = place.name;
          // Decorative: stops MapLibre announcing each one as a "Map marker" button.
          element.setAttribute("aria-hidden", "true");
          element.setAttribute("aria-label", "");
          element.setAttribute("role", "presentation");
          new lib.Marker({ element }).setLngLat([place.lng, place.lat]).addTo(map);
        }

        // The credit sits in whichever bottom corner the layout leaves free.
        const attribution = new lib.AttributionControl({ compact: true });
        const desktop = window.matchMedia(DESKTOP_QUERY);
        const placeAttribution = () => {
          if (map.hasControl(attribution)) map.removeControl(attribution);
          map.addControl(attribution, desktop.matches ? "bottom-right" : "bottom-left");
        };
        placeAttribution();
        desktop.addEventListener("change", placeAttribution);
        cleanups.push(() => desktop.removeEventListener("change", placeAttribution));

        // The country and sea names step back once town names take over.
        const syncZoom = () => container.toggleAttribute("data-close", map.getZoom() > 8.8);
        map.on("zoom", syncZoom);
        syncZoom();

        map.on("click", () => select(null));

        setEngine({ lib, map });
        ready();
      })
      .catch((error) => {
        console.error("[map] The map could not be created:", error);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      registry.clear();
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  // Keep one pin per visible battle.
  useEffect(() => {
    if (!engine) return;
    const { lib, map } = engine;
    const registry = pins.current;
    const wanted = new Set(battles.map((battle) => battle.slug));

    for (const [slug, pin] of registry) {
      if (wanted.has(slug)) continue;
      pin.marker.remove();
      registry.delete(slug);
    }

    for (const battle of battles) {
      if (registry.has(battle.slug)) continue;

      const element = createPin(battle);
      let pressedAt: [number, number] | null = null;
      element.addEventListener("pointerdown", (event) => {
        pressedAt = [event.clientX, event.clientY];
      });
      element.addEventListener("click", (event) => {
        // Otherwise the map would also see a click on empty ground and close the card again.
        event.stopPropagation();
        const travelled = pressedAt ? Math.hypot(event.clientX - pressedAt[0], event.clientY - pressedAt[1]) : 0;
        // `detail` is 0 for a keyboard press, which has no position to compare.
        if (event.detail === 0 || travelled <= TAP_SLOP) select(battle.slug);
      });

      const marker = new lib.Marker({ element }).setLngLat([battle.lng, battle.lat]).addTo(map);
      registry.set(battle.slug, { marker, element });
    }
  }, [engine, battles]);

  // Highlight the selected pin and bring it into the part of the map the card leaves visible.
  useEffect(() => {
    if (!engine) return;
    const { map } = engine;

    for (const [slug, { element }] of pins.current) {
      const active = slug === selected?.slug;
      element.classList.toggle(styles.pinSelected, active);
      element.setAttribute("aria-pressed", String(active));
    }
    if (!selected) return;

    const area = visibleArea(map, true);
    map.flyTo({
      center: [selected.lng, selected.lat],
      zoom: Math.max(map.getZoom(), FOCUS_ZOOM),
      offset: [(area.left - area.right) / 2, (area.top - area.bottom) / 2],
      speed: 1.3,
      curve: 1.25,
      maxDuration: 1800,
    });
  }, [engine, selected]);

  const frame = useEffectEvent((map: MapLibreMap, animate: boolean) => {
    // A reader looking at a battle keeps their view.
    if (selected) return;
    map.fitBounds(boundsOf(battles, anchorHome), {
      padding: visibleArea(map, covered),
      maxZoom: FRAME_MAX_ZOOM,
      animate,
      duration: 900,
    });
  });

  // Show every visible battle: on arrival, and whenever the filter changes or the view is reset.
  useEffect(() => {
    if (!engine) return;
    frame(engine.map, framedOnce.current);
    framedOnce.current = true;
  }, [engine, frameKey]);

  return (
    <div className={styles.root}>
      <div ref={containerRef} className={styles.map} />
      {failed && (
        <p className={styles.unavailable} role="status">
          The map could not be shown on this device. Use Explore Battles to browse instead.
        </p>
      )}
    </div>
  );
}
