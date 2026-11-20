import type { ExpressionSpecification, LngLatBoundsLike, StyleSpecification } from "maplibre-gl";

/** Albania and its neighbours: where the map opens when there are no battles to frame. */
export const HOME_BOUNDS: LngLatBoundsLike = [
  [18.7, 39.5],
  [21.5, 42.9],
];

/** How far the map can be panned: the Balkans and the seas around them. */
export const MAX_BOUNDS: LngLatBoundsLike = [
  [7, 32],
  [35, 50],
];

/**
 * The few place names drawn on the map at every zoom, set in the site's own serif.
 * Town and village names come from the map data instead, once the reader zooms in.
 */
export const MAP_LABELS: { name: string; kind: "home" | "country" | "sea"; lng: number; lat: number }[] = [
  { name: "Albania", kind: "home", lng: 20.05, lat: 41.0 },
  { name: "Kosovo", kind: "country", lng: 20.9, lat: 42.58 },
  { name: "Montenegro", kind: "country", lng: 19.25, lat: 42.8 },
  { name: "Serbia", kind: "country", lng: 21.0, lat: 43.8 },
  { name: "North Macedonia", kind: "country", lng: 21.75, lat: 41.6 },
  { name: "Greece", kind: "country", lng: 21.9, lat: 39.45 },
  { name: "Italy", kind: "country", lng: 16.5, lat: 40.75 },
  { name: "Bosnia and Herzegovina", kind: "country", lng: 17.8, lat: 44.2 },
  { name: "Bulgaria", kind: "country", lng: 25.2, lat: 42.7 },
  { name: "Adriatic Sea", kind: "sea", lng: 17.9, lat: 42.05 },
  { name: "Ionian Sea", kind: "sea", lng: 18.9, lat: 38.9 },
];

const PLACE_NAME: ExpressionSpecification = ["coalesce", ["get", "name:latin"], ["get", "name"]];

/**
 * A dark, quiet map: relief and coastlines only, no roads. Vector tiles are from OpenFreeMap
 * (OpenStreetMap data) and the relief from the Terrain Tiles open dataset; neither needs a key.
 */
export const MAP_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
    },
    relief: {
      type: "raster-dem",
      tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
      encoding: "terrarium",
      tileSize: 256,
      maxzoom: 11,
      attribution: '<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank">Terrain Tiles</a>',
    },
  },
  layers: [
    { id: "land", type: "background", paint: { "background-color": "#1a1713" } },
    {
      id: "woodland",
      type: "fill",
      source: "osm",
      "source-layer": "landcover",
      filter: ["==", ["get", "class"], "wood"],
      paint: { "fill-color": "#1b2115", "fill-opacity": 0.6 },
    },
    {
      id: "relief",
      type: "hillshade",
      source: "relief",
      paint: {
        "hillshade-shadow-color": "#000000",
        "hillshade-highlight-color": "#8c765b",
        "hillshade-accent-color": "#0a0806",
        "hillshade-exaggeration": 0.6,
      },
    },
    { id: "water", type: "fill", source: "osm", "source-layer": "water", paint: { "fill-color": "#08121a" } },
    {
      id: "coast",
      type: "line",
      source: "osm",
      "source-layer": "water",
      paint: { "line-color": "rgba(150, 175, 190, 0.16)", "line-width": 0.8 },
    },
    {
      id: "rivers",
      type: "line",
      source: "osm",
      "source-layer": "waterway",
      minzoom: 8,
      filter: ["==", ["get", "class"], "river"],
      paint: { "line-color": "#0d1c27", "line-width": 1 },
    },
    {
      id: "borders",
      type: "line",
      source: "osm",
      "source-layer": "boundary",
      filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1]],
      paint: {
        "line-color": "rgba(246, 243, 241, 0.34)",
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.7, 10, 1.4],
        "line-dasharray": [2, 2.5],
      },
    },
    {
      id: "towns",
      type: "symbol",
      source: "osm",
      "source-layer": "place",
      minzoom: 7.5,
      filter: ["match", ["get", "class"], ["city", "town"], true, false],
      layout: {
        "text-field": PLACE_NAME,
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 7.5, 10.5, 12, 13.5],
        "text-letter-spacing": 0.04,
        "text-max-width": 7,
        "symbol-sort-key": ["get", "rank"],
      },
      paint: {
        "text-color": "rgba(246, 243, 241, 0.62)",
        "text-halo-color": "rgba(5, 3, 3, 0.85)",
        "text-halo-width": 1.2,
      },
    },
    {
      id: "villages",
      type: "symbol",
      source: "osm",
      "source-layer": "place",
      minzoom: 10.5,
      filter: ["==", ["get", "class"], "village"],
      layout: {
        "text-field": PLACE_NAME,
        "text-font": ["Noto Sans Regular"],
        "text-size": 11,
        "text-max-width": 7,
        "symbol-sort-key": ["get", "rank"],
      },
      paint: {
        "text-color": "rgba(246, 243, 241, 0.46)",
        "text-halo-color": "rgba(5, 3, 3, 0.85)",
        "text-halo-width": 1.1,
      },
    },
  ],
};
