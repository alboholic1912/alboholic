export type MapLibre = typeof import("maplibre-gl");

let loading: Promise<MapLibre> | null = null;

/**
 * Loads MapLibre on demand, once, for every map on the site. The library draws its tiles in a
 * web worker that ships as a separate file and is normally found beside the library itself;
 * once bundled it isn't, so the worker is emitted as an asset here and MapLibre is told where.
 */
export function loadMapLibre(): Promise<MapLibre> {
  loading ??= import("maplibre-gl").then((lib) => {
    lib.setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);
    return lib;
  });
  return loading;
}
