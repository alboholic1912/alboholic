import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ContentType } from "@/lib/content/types";
import { getAccount } from "./publish";
import type { InstagramPostRow, InstagramStatus } from "./types";

export async function listInstagramPosts({
  status,
  contentType,
  contentId,
}: { status?: InstagramStatus; contentType?: ContentType; contentId?: string } = {}): Promise<InstagramPostRow[] | null> {
  const supabase = await createClient();
  let query = supabase.from("instagram_posts").select("*");
  if (status) query = query.eq("status", status);
  if (contentType && contentId) query = query.eq("content_type", contentType).eq("content_id", contentId);
  // Upcoming posts read soonest first; everything else newest first.
  query =
    status === "scheduled"
      ? query.order("scheduled_at", { ascending: true })
      : query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) {
    // Most likely supabase/instagram.sql hasn't been run yet; the pages say so.
    console.error("[instagram] could not list posts:", error.message);
    return null;
  }
  return data as InstagramPostRow[];
}

export async function getInstagramPost(id: string): Promise<InstagramPostRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("instagram_posts").select("*").eq("id", id).maybeSingle();
  return (data as InstagramPostRow | null) ?? null;
}

/** The connected account without its token, for display. */
export async function getConnectedAccount() {
  const account = await getAccount(await createClient());
  return account
    ? { username: account.username, igUserId: account.ig_user_id, expiresAt: account.token_expires_at }
    : null;
}
