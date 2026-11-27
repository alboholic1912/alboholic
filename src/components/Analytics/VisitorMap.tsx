"use client";

import { useEffect, useRef, useState } from "react";
import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap, Marker, Popup, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { loadMapLibre, type MapLibre } from "@/lib/maplibre";
import styles from "./analytics.module.css";

export interface MapPoint {
  key: string;
  lat: number;
  lng: number;
  /** How many visitors the dot stands for; sets its size. */
  weight: number;
  title: string;
  detail: string;
}

/**
 * The whole world, dark and quiet: land, sea and country borders from the same open map data
 * as the Battles map (OpenFreeMap), with country names only.
 */
const WORLD_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: { osm: { type: "vector", url: "https://tiles.openfreemap.org/planet" } },
  layers: [
    { id: "land", type: "background", paint: { "background-color": "#17110f" } },
    { id: "water", type: "fill", source: "osm", "source-layer": "water", paint: { "fill-color": "#07090c" } },
    {
      id: "borders",
      type: "line",
      source: "osm",
      "source-layer": "boundary",
      filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1]],
      paint: { "line-color": "#3a2c28", "line-width": 0.7 },
    },
    {
      id: "countries",
      type: "symbol",
      source: "osm",
      "source-layer": "place",
      filter: ["==", ["get", "class"], "country"],
      layout: {
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name:latin"], ["get", "name"]],
        "text-font": ["Noto Sans Regular"],
        "text-size": 10,
        "text-max-width": 7,
      },
      paint: { "text-color": "#6b5f5a", "text-halo-color": "#17110f", "text-halo-width": 1 },
    },
  ],
};

const START = { center: [18, 38] as [number, number], zoom: 1.4 };
/** Area follows the visitor count; capped so a busy town doesn't cover its neighbours. */
const DOT_RADIUS: ExpressionSpecification = ["min", 22, ["+", 3, ["*", 2.2, ["sqrt", ["get", "weight"]]]]];

function toGeoJSON(points: MapPoint[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { key: p.key, weight: p.weight, title: p.title, detail: p.detail },
    })),
  };
}

/** Popup text goes in as text, never as HTML: town names come from request headers. */
function popupContent(title: string, detail: string): HTMLElement {
  const box = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = title;
  const line = document.createElement("div");
  line.textContent = detail;
  box.append(strong, line);
  return box;
}

/**
 * Where visitors are, by town. In "range" mode each dot's size follows the number of visitors
 * from that town; in "live" mode every reader on the site right now gets a pulsing dot.
 */
export default function VisitorMap({ points, mode }: { points: MapPoint[]; mode: "live" | "range" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const libRef = useRef<MapLibre | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const framedRef = useRef("");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    loadMapLibre()
      .then((lib) => {
        if (cancelled) return;
        libRef.current = lib;
        const map = new lib.Map({
          container,
          style: WORLD_STYLE,
          center: START.center,
          zoom: START.zoom,
          minZoom: 0.6,
          maxZoom: 9,
          renderWorldCopies: false,
          attributionControl: false,
          dragRotate: false,
          pitchWithRotate: false,
        });
        mapRef.current = map;
        map.touchZoomRotate.disableRotation();
        map.addControl(new lib.AttributionControl({ compact: true }), "bottom-right");
        // MapLibre opens the map credit on first load; fold it into its (i) button once the map settles.
        map.once("idle", () => {
          const credit = container.querySelector(".maplibregl-ctrl-attrib");
          credit?.classList.remove("maplibregl-compact-show");
          credit?.removeAttribute("open");
        });
        map.addControl(new lib.NavigationControl({ showCompass: false }), "top-right");

        map.on("load", () => {
          map.addSource("visitors", { type: "geojson", data: toGeoJSON([]) });
          map.addLayer({
            id: "visitors-glow",
            type: "circle",
            source: "visitors",
            paint: {
              "circle-color": "#ef4045",
              "circle-opacity": 0.16,
              "circle-blur": 0.7,
              "circle-radius": ["*", 1.8, DOT_RADIUS],
            },
            // Smaller towns are drawn on top, so they stay visible beside a big one.
            layout: { "circle-sort-key": ["-", 0, ["get", "weight"]] },
          });
          map.addLayer({
            id: "visitors-dots",
            type: "circle",
            source: "visitors",
            paint: {
              "circle-color": "#ef4045",
              "circle-opacity": 0.82,
              "circle-radius": DOT_RADIUS,
              "circle-stroke-color": "#0d0a0a",
              "circle-stroke-width": 2,
            },
            layout: { "circle-sort-key": ["-", 0, ["get", "weight"]] },
          });

          let popup: Popup | null = null;
          map.on("mousemove", "visitors-dots", (event) => {
            const feature = event.features?.[0];
            if (!feature) return;
            map.getCanvas().style.cursor = "pointer";
            const { title, detail } = feature.properties as { title: string; detail: string };
            popup ??= new lib.Popup({ closeButton: false, closeOnClick: false, offset: 12, className: styles.mapPopup });
            popup.setLngLat(event.lngLat).setDOMContent(popupContent(title, detail)).addTo(map);
          });
          map.on("mouseleave", "visitors-dots", () => {
            map.getCanvas().style.cursor = "";
            popup?.remove();
          });

          setReady(true);
        });
      })
      .catch((error) => {
        console.error("[analytics] The visitor map could not be created:", error);
        setFailed(true);
      });

    return () => {
      cancelled = true;
      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // The list arrives as a new array on every refresh; its contents are what the map depends on.
  const pointsKey = JSON.stringify(points);

  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!ready || !map || !lib) return;
    const list = JSON.parse(pointsKey) as MapPoint[];

    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];
    const source = map.getSource("visitors") as GeoJSONSource | undefined;

    if (mode === "range") {
      source?.setData(toGeoJSON(list));
    } else {
      source?.setData(toGeoJSON([]));
      for (const point of list) {
        const element = document.createElement("div");
        element.className = styles.livePin;
        const popup = new lib.Popup({ closeButton: false, offset: 14, className: styles.mapPopup }).setDOMContent(
          popupContent(point.title, point.detail),
        );
        element.addEventListener("mouseenter", () => popup.setLngLat([point.lng, point.lat]).addTo(map));
        element.addEventListener("mouseleave", () => popup.remove());
        markersRef.current.push(new lib.Marker({ element }).setLngLat([point.lng, point.lat]).addTo(map));
      }
    }

    // Frame the dots when the mode changes or a new town appears, not on every refresh.
    const frameKey = `${mode}:${list.map((p) => p.key).sort().join("|")}`;
    if (frameKey === framedRef.current) return;
    framedRef.current = frameKey;
    if (list.length === 0) {
      map.easeTo({ center: START.center, zoom: START.zoom, duration: 700 });
    } else if (list.length === 1) {
      map.easeTo({ center: [list[0].lng, list[0].lat], zoom: 4, duration: 700 });
    } else {
      const bounds = new lib.LngLatBounds();
      for (const p of list) bounds.extend([p.lng, p.lat]);
      map.fitBounds(bounds, { padding: 70, maxZoom: 5, duration: 700 });
    }
  }, [ready, pointsKey, mode]);

  return (
    <div className={styles.mapFrame}>
      <div ref={containerRef} className={styles.map} />
      {failed && (
        <p className={styles.mapMessage}>The map couldn&rsquo;t load. The list of places beside it is complete.</p>
      )}
    </div>
  );
}
