import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishPost, refreshAccountIfDue } from "@/lib/instagram/publish";

// Publishing a carousel means several calls to Instagram plus image processing.
export const maxDuration = 60;

/** How many due posts one run handles, so a backlog can't run past the time limit. */
const BATCH = 3;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Called every few minutes by the scheduler (see supabase/instagram.sql, or Vercel Cron, which
 * sends the same Authorization header). Publishes scheduled posts that are due.
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    await refreshAccountIfDue(supabase);
  } catch (err) {
    console.error("[instagram cron] token refresh failed:", err);
  }

  // A run that was cut off mid-publish leaves its post stuck; after 10 minutes, mark it failed.
  await supabase
    .from("instagram_posts")
    .update({ status: "failed", error: "Publishing was interrupted. Check Instagram before trying again." })
    .eq("status", "publishing")
    .lt("updated_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());

  const { data: due, error } = await supabase
    .from("instagram_posts")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(BATCH);

  if (error) {
    console.error("[instagram cron] could not read due posts:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  const results = [];
  for (const { id } of due ?? []) {
    const failure = await publishPost(supabase, id, ["scheduled"]);
    results.push({ id, ok: failure === null, error: failure ?? undefined });
  }

  return Response.json({ published: results.filter((r) => r.ok).length, results });
}
