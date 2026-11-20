"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { loadMapLibre, type MapLibre } from "@/lib/maplibre";
import { HOME_BOUNDS, MAP_STYLE } from "@/components/BattleMap/mapStyle";
import styles from "./LocationPicker.module.css";

/** About one metre: plenty for a battlefield, and short enough to read. */
const PRECISION = 5;
const PIN_ZOOM = 10;

function parse(value: string, limit: number): number | null {
  const number = value.trim() ? Number(value.trim().replace(",", ".")) : NaN;
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

/**
 * The Studio's map pin editor. It posts two form fields, `lat` and `lng`: click the map
 * or drag the pin to set them, or type them in. Both empty means the battle has no pin.
 */
export default function LocationPicker({ lat, lng }: { lat: number | null; lng: number | null }) {
  const [pin, setPin] = useState({ lat: lat === null ? "" : String(lat), lng: lng === null ? "" : String(lng) });
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<Marker | null>(null);
  const [engine, setEngine] = useState<{ lib: MapLibre; map: MapLibreMap } | null>(null);

  const latitude = parse(pin.lat, 90);
  const longitude = parse(pin.lng, 180);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let map: MapLibreMap | undefined;

    loadMapLibre()
      .then((lib) => {
        if (cancelled) return;

        map = new lib.Map({
          container,
          style: MAP_STYLE,
          bounds: HOME_BOUNDS,
          maxZoom: 16,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          attributionControl: { compact: true },
        });
        map.addControl(new lib.NavigationControl({ showCompass: false }), "top-right");
        map.on("click", (event) => {
          setPin({ lat: event.lngLat.lat.toFixed(PRECISION), lng: event.lngLat.lng.toFixed(PRECISION) });
        });
        setEngine({ lib, map });
      })
      .catch((error) => console.error("[map] The pin editor's map could not be created:", error));

    return () => {
      cancelled = true;
      markerRef.current = null;
      map?.remove();
    };
  }, []);

  // Keep the pin on the map in step with the two fields.
  useEffect(() => {
    if (!engine) return;
    const { lib, map } = engine;

    if (latitude === null || longitude === null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (!markerRef.current) {
      const marker = new lib.Marker({ color: "#ef4045", draggable: true }).setLngLat([longitude, latitude]).addTo(map);
      marker.on("dragend", () => {
        const position = marker.getLngLat();
        setPin({ lat: position.lat.toFixed(PRECISION), lng: position.lng.toFixed(PRECISION) });
      });
      markerRef.current = marker;
      // Arriving with a pin already placed: start the editor looking at it.
      map.jumpTo({ center: [longitude, latitude], zoom: Math.max(map.getZoom(), PIN_ZOOM) });
      return;
    }

    markerRef.current.setLngLat([longitude, latitude]);
    if (!map.getBounds().contains([longitude, latitude])) map.easeTo({ center: [longitude, latitude] });
  }, [engine, latitude, longitude]);

  return (
    <div className={styles.root}>
      <div ref={containerRef} className={styles.map} />

      <div className={styles.fields}>
        <input
          type="text"
          name="lat"
          inputMode="decimal"
          aria-label="Latitude"
          placeholder="Latitude, e.g. 40.1179"
          value={pin.lat}
          onChange={(event) => setPin({ ...pin, lat: event.target.value })}
        />
        <input
          type="text"
          name="lng"
          inputMode="decimal"
          aria-label="Longitude"
          placeholder="Longitude, e.g. 20.0881"
          value={pin.lng}
          onChange={(event) => setPin({ ...pin, lng: event.target.value })}
        />
        <button type="button" className={styles.clear} onClick={() => setPin({ lat: "", lng: "" })} disabled={!pin.lat && !pin.lng}>
          Remove pin
        </button>
      </div>

      {latitude === null || longitude === null ? (
        <p className={styles.warning}>No pin yet, so this battle will not appear on the map.</p>
      ) : null}
    </div>
  );
}
