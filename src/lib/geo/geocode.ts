import "server-only";

// OpenStreetMap's free geocoder. Its usage policy asks for an identifying User-Agent and at
// most one request a second, which the Studio's occasional lookups stay well inside.
const ENDPOINT = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Alboholic Studio (Albanian history site; placing battle map pins)";
const TIMEOUT_MS = 4000;
const PAUSE_BETWEEN_LOOKUPS_MS = 1100;
const MAX_LOOKUPS = 3;

export interface Pin {
  lat: number | null;
  lng: number | null;
  /** How the pin was placed, for the editor reviewing it. */
  pin_note: string;
}

interface Place {
  lat: number;
  lng: number;
  label: string;
}

async function lookUp(query: string): Promise<Place | null> {
  const params = new URLSearchParams({ q: query, format: "jsonv2", limit: "1", "accept-language": "en" });
  try {
    const response = await fetch(`${ENDPOINT}?${params}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const [hit] = (await response.json()) as { lat: string; lon: string; display_name: string }[];
    const [lat, lng] = [Number(hit?.lat), Number(hit?.lon)];
    if (!hit || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, label: hit.display_name };
  } catch (err) {
    console.error(`[geocode] Looking up "${query}" failed:`, err);
    return null;
  }
}

/**
 * Turns place-name queries (most precise first) into a map pin by trying each in turn.
 * Never throws: a battle whose place can't be found is saved without a pin, and the note
 * tells the editor why. Coordinates always come from the map data, never from the AI.
 */
export async function locatePin(queries: string[]): Promise<Pin> {
  const tried = queries.map((query) => query.trim()).filter(Boolean).slice(0, MAX_LOOKUPS);
  if (tried.length === 0) {
    return { lat: null, lng: null, pin_note: "The sources do not say where this was fought. Place the pin by hand." };
  }

  for (const [index, query] of tried.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, PAUSE_BETWEEN_LOOKUPS_MS));

    const place = await lookUp(query);
    if (!place) continue;

    const { lat, lng } = place;
    const pin_note =
      index === 0
        ? `Placed from OpenStreetMap: ${place.label}. Check it against the sources.`
        : `Approximate. "${tried[0]}" was not found, so the pin is at ${place.label}. Move it to the battlefield.`;
    return { lat, lng, pin_note };
  }

  return {
    lat: null,
    lng: null,
    pin_note: `OpenStreetMap found nothing for ${tried.map((query) => `"${query}"`).join(" or ")}. Place the pin by hand.`,
  };
}
