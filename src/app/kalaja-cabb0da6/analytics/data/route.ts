import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { labelsFor } from "@/lib/analytics/labels";
import { RANGES, type Overview, type Range, type Report, type ReportResponse } from "@/lib/analytics/types";

/**
 * The numbers behind the Analytics page for one range (?range=24h|7d|30d), with days and
 * hours in the viewer's time zone (?tz=Europe/Tirane). The report functions refuse anyone
 * who isn't an admin, and the proxy sends signed-out visitors to the login page first.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const range: Range = RANGES.includes(params.get("range") as Range) ? (params.get("range") as Range) : "7d";
  const tz = (params.get("tz") ?? "UTC").slice(0, 64);

  const supabase = await createClient();
  const [overview, report] = await Promise.all([
    supabase.rpc("analytics_overview", { p_tz: tz }),
    supabase.rpc("analytics_report", { p_range: range, p_tz: tz }),
  ]);

  const error = overview.error ?? report.error;
  if (error) {
    const missing = error.code === "PGRST202" || error.code === "42883" || error.code === "42P01";
    const body: ReportResponse = {
      error: missing
        ? "Analytics isn't set up yet: run supabase/analytics.sql in the Supabase SQL editor."
        : error.code === "42501"
          ? "You need to be signed in as an admin."
          : error.message,
    };
    return Response.json(body, { status: missing ? 503 : error.code === "42501" ? 403 : 500 });
  }

  const data = report.data as Report;
  const labels = await labelsFor(
    supabase,
    [...data.pages.map((p) => p.path), ...data.landing.map((p) => p.path)],
    data.battles.map((b) => b.slug),
  );

  const body: ReportResponse = { overview: overview.data as Overview, report: data, labels };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
