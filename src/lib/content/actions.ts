"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { uploadImage } from "@/lib/supabase/storage";
import { buildSourceParts, generateStructuredContent, type SourceInput } from "@/lib/ai/gemini";
import { CONTENT_CONFIG } from "./config";
import { isContentType, type ContentType } from "./types";
import { slugify } from "./slug";

const ADMIN_PATH = "/kalaja-cabb0da6";

function estimateReadTime(paragraphs: string[]): string {
  const words = paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function requireTypeAndId(formData: FormData): { type: ContentType; id: string } {
  const type = formData.get("type");
  const id = formData.get("id");
  if (typeof type !== "string" || !isContentType(type) || typeof id !== "string" || !id) {
    throw new Error("Invalid request.");
  }
  return { type, id };
}

async function uniqueSlug(type: ContentType, title: string): Promise<string> {
  const supabase = await createClient();
  const base = slugify(title);
  let candidate = base;
  let attempt = 1;

  while (true) {
    const { data } = await supabase.from(type).select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

export async function generateContent(formData: FormData) {
  await requireUser();

  const typeValue = formData.get("type");
  if (typeof typeValue !== "string" || !isContentType(typeValue)) {
    throw new Error("Unknown content type.");
  }
  const type = typeValue;
  const config = CONTENT_CONFIG[type];

  const rawText = String(formData.get("rawText") ?? "").trim();
  const youtubeUrls = String(formData.get("youtubeUrls") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  const sources: SourceInput[] = [];
  if (rawText) sources.push({ kind: "text", label: "Pasted text", value: rawText });
  for (const url of youtubeUrls) sources.push({ kind: "youtube", url });
  for (const file of files) sources.push({ kind: "file", file });

  if (sources.length === 0) {
    throw new Error("Add at least one source: text, a PDF, or a YouTube URL.");
  }

  const { parts, record } = await buildSourceParts(sources);

  const generated = await generateStructuredContent<Record<string, unknown>>({
    typeInstruction: config.aiInstruction,
    sourceParts: parts,
    responseSchema: config.aiSchema,
  });

  const row: Record<string, unknown> = { ...config.defaults, sources: record, status: "review" };

  for (const [key, value] of Object.entries(generated)) {
    const column = key === "imageTone" ? "image_tone" : key;
    row[column] = value;
  }

  if (type === "stories" && Array.isArray(row.body)) {
    row.read_time = estimateReadTime(row.body as string[]);
  }

  const title = String(row[config.titleField] ?? "untitled");
  row.slug = await uniqueSlug(type, title);

  const supabase = await createClient();
  const { data, error } = await supabase.from(type).insert(row).select("id").single();

  if (error) {
    throw new Error(`Could not save the generated ${config.label.toLowerCase()}: ${error.message}`);
  }

  redirect(`${ADMIN_PATH}/${type}/${data.id}`);
}

export async function updateContent(formData: FormData) {
  await requireUser();
  const { type, id } = requireTypeAndId(formData);
  const config = CONTENT_CONFIG[type];
  const supabase = await createClient();

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const slug = String(formData.get("slug") ?? "").trim();
  if (slug) update.slug = slug;

  for (const field of config.fields) {
    if (field.kind === "checkbox") {
      update[field.key] = formData.get(field.key) === "on";
    } else if (field.kind === "number") {
      update[field.key] = Number(formData.get(field.key) ?? 0);
    } else if (field.kind === "paragraphs") {
      update[field.key] = String(formData.get(field.key) ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    } else {
      update[field.key] = String(formData.get(field.key) ?? "");
    }
  }

  if (type === "stories" && Array.isArray(update.body)) {
    update.read_time = estimateReadTime(update.body as string[]);
  }

  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    update.image = await uploadImage(image, `${type}/${id}`);
  }

  const { error } = await supabase.from(type).update(update).eq("id", id);
  if (error) throw new Error(`Could not save changes: ${error.message}`);

  redirect(`${ADMIN_PATH}/${type}/${id}`);
}

export async function publishContent(formData: FormData) {
  await requireUser();
  const { type, id } = requireTypeAndId(formData);
  const supabase = await createClient();
  const { error } = await supabase.from(type).update({ status: "published" }).eq("id", id);
  if (error) throw new Error(error.message);
  redirect(`${ADMIN_PATH}/${type}/${id}`);
}

export async function unpublishContent(formData: FormData) {
  await requireUser();
  const { type, id } = requireTypeAndId(formData);
  const supabase = await createClient();
  const { error } = await supabase.from(type).update({ status: "review" }).eq("id", id);
  if (error) throw new Error(error.message);
  redirect(`${ADMIN_PATH}/${type}/${id}`);
}

export async function deleteContent(formData: FormData) {
  await requireUser();
  const { type, id } = requireTypeAndId(formData);
  const supabase = await createClient();
  const { error } = await supabase.from(type).delete().eq("id", id);
  if (error) throw new Error(error.message);
  redirect(`${ADMIN_PATH}/${type}`);
}
