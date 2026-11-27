import { createClient } from "@/lib/supabase/server";
import { labelsFor } from "@/lib/analytics/labels";
import type { Live, LiveResponse } from "@/lib/analytics/types";

/** Who is on the site right now and the latest page views. The Analytics page asks every few seconds. */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("analytics_live");

  if (error) {
    const body: LiveResponse = { error: error.message };
    return Response.json(body, { status: error.code === "42501" ? 403 : 500 });
  }

  const live = data as Live;
  const battles = [...live.online, ...live.recent].flatMap((v) => (v.battle ? [v.battle] : []));
  const labels = await labelsFor(
    supabase,
    [...live.online.map((v) => v.path), ...live.recent.map((v) => v.path)],
    battles,
  );

  const body: LiveResponse = { live, labels };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
