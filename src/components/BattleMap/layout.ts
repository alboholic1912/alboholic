// Layout numbers the map camera and the sheets must agree on. Each is mirrored in the CSS it names.

/** Where the layout switches from a phone bottom sheet to a desktop side panel. */
export const DESKTOP_QUERY = "(min-width: 960px)";

/** The share of the map a bottom sheet covers when it first opens. See BottomSheet.module.css. */
export const PEEK_FRACTION = 0.44;

/** Width of the desktop side panel plus the gap around it, in pixels. See BottomSheet.module.css. */
export const PANEL_SPACE = 384 + 32;

export function isDesktop(): boolean {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

/** The region as shown in lists: the last part of "Mashkullorë, Gjirokastër". */
export function regionOf(location: string): string {
  return location.split(",").pop()?.trim() ?? "";
}

/** The place as shown on a pin: the first part of "Mashkullorë, Gjirokastër". */
export function placeOf(location: string): string {
  return location.split(",")[0].trim();
}

/** A battle's year for lists, e.g. "1908" or "229 BC". Empty when the year is unknown. */
export function yearLabel(year: number): string {
  if (year > 0) return String(year);
  return year < 0 ? `${-year} BC` : "";
}
