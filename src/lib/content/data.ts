import "server-only";
import { createClient } from "@/lib/supabase/server";
import { CONTENT_TYPES, type ContentType, type ContentRow, type Status } from "./types";

export async function listContent<T extends ContentType>(
  type: T,
  status?: Status
): Promise<ContentRow<T>[]> {
  const supabase = await createClient();
  let query = supabase.from(type).select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ContentRow<T>[];
}

export async function getContentById<T extends ContentType>(
  type: T,
  id: string
): Promise<ContentRow<T> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from(type).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ContentRow<T> | null) ?? null;
}

export type StatusCounts = Record<ContentType, { review: number; published: number }>;

export async function countsByStatus(): Promise<StatusCounts> {
  const supabase = await createClient();
  const result = {} as StatusCounts;

  await Promise.all(
    CONTENT_TYPES.map(async (type) => {
      const [{ count: review }, { count: published }] = await Promise.all([
        supabase.from(type).select("id", { count: "exact", head: true }).eq("status", "review"),
        supabase.from(type).select("id", { count: "exact", head: true }).eq("status", "published"),
      ]);
      result[type] = { review: review ?? 0, published: published ?? 0 };
    })
  );

  return result;
}
