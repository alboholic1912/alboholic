"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { requireUser } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { uploadImage } from "@/lib/supabase/storage";
import { buildSourceBlocks, generateStructuredContent, type SourceInput } from "@/lib/ai/anthropic";
import { DEFAULT_AI_MODEL, getAiModel } from "@/lib/ai/models";
import { logUsage } from "@/lib/ai/usage";
import { locatePin } from "@/lib/geo/geocode";
import { CONTENT_CONFIG } from "./config";
import { cleanRecords, parseRecordLines } from "./records";
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

/** Reads a latitude or longitude from a form field. Empty, non-numeric and out-of-range values are null. */
function parseCoordinate(value: FormDataEntryValue | null, limit: number): number | null {
  const text = typeof value === "string" ? value.trim().replace(",", ".") : "";
  const number = text ? Number(text) : NaN;
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

/** Claude returns camelCase keys; the tables use snake_case columns. */
function toColumn(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** How each linked type picks from the site index: which story field to fill, and which people field to match. */
const LINK_RULES: Partial<Record<ContentType, { stories: string; noStories: string; peopleField: string }>> = {
  people: {
    stories:
      "- relatedStories: the slugs of up to 4 stories from this index that are clearly about this person, " +
      "or about events the sources say they took part in. Return an empty list if none fit.",
    noStories: "- relatedStories: return an empty list; there are no stories to link to yet.",
    peopleField: "relatedPeople",
  },
  battles: {
    stories:
      "- storySlug: the slug of the one story from this index that tells the story of this battle. " +
      "Return an empty string if none does.",
    noStories: "- storySlug: return an empty string; there are no stories to link to yet.",
    peopleField: "keyPeople",
  },
};

/**
 * Lists the stories and people already on the site, so a generated profile or battle can link
 * to them. This is the one part of the prompt that isn't a source, and it says so.
 */
async function linkingContext(type: ContentType): Promise<{ instruction: string; storySlugs: Set<string> } | null> {
  const rules = LINK_RULES[type];
  if (!rules) return null;

  const supabase = await createClient();
  const [{ data: stories }, { data: people }] = await Promise.all([
    supabase.from("stories").select("slug, title, excerpt").order("date", { ascending: false }),
    supabase.from("people").select("name").order("name", { ascending: true }),
  ]);

  const lines = ["", "", "Site index, for linking only. It is not a source, so take no facts from it."];

  if (stories?.length) {
    lines.push(
      "Stories on Alboholic, as slug: title - excerpt:",
      ...stories.map((story) => `- ${story.slug}: ${story.title} - ${story.excerpt}`),
      rules.stories
    );
  } else {
    lines.push(rules.noStories);
  }

  if (people?.length) {
    lines.push(
      `People already on Alboholic: ${people.map((person) => person.name).join("; ")}.`,
      `When one of your ${rules.peopleField} is in that list, spell the name exactly as it appears there.`
    );
  }

  return {
    instruction: lines.join("\n"),
    storySlugs: new Set((stories ?? []).map((story) => String(story.slug))),
  };
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

  try {
    const rawText = String(formData.get("rawText") ?? "").trim();
    // Only allow known models so a crafted request can't pick an arbitrary (expensive) one.
    const model = getAiModel(String(formData.get("model") ?? ""))?.id ?? DEFAULT_AI_MODEL;
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

    const sources: SourceInput[] = [];
    if (rawText) sources.push({ kind: "text", label: "Pasted text", value: rawText });
    for (const file of files) sources.push({ kind: "file", file });

    if (sources.length === 0) {
      throw new Error("Add at least one source: text or a PDF.");
    }

    const { blocks, record } = await buildSourceBlocks(sources);
    const links = await linkingContext(type);

    const { data: generated, usage } = await generateStructuredContent<Record<string, unknown>>({
      model,
      typeInstruction: config.aiInstruction + (links?.instruction ?? ""),
      sourceBlocks: blocks,
      jsonSchema: config.aiSchema,
    });
    await logUsage(type, usage);

    const row: Record<string, unknown> = { ...config.defaults, sources: record, status: "review" };

    for (const [key, value] of Object.entries(generated)) {
      row[toColumn(key)] = value;
    }

    // Claude leaves a field empty when the sources can't fill it; drop those list items.
    for (const field of config.fields) {
      if (field.kind === "records" && field.columns) {
        row[field.key] = cleanRecords(row[field.key], field.columns);
      }
    }

    if (type === "people") {
      const picked = Array.isArray(row.related_stories) ? row.related_stories : [];
      row.related_stories = picked.filter((slug) => links?.storySlugs.has(slug));
    }

    if (type === "battles") {
      row.story_slug = links?.storySlugs.has(String(row.story_slug)) ? row.story_slug : "";

      // Claude only names the place; the coordinates come from OpenStreetMap, never from the model.
      const queries = Array.isArray(row.geocode_queries) ? row.geocode_queries.map(String) : [];
      delete row.geocode_queries;
      Object.assign(row, await locatePin(queries));
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
  } catch (err) {
    unstable_rethrow(err);
    console.error(`[generateContent] type=${type} failed:`, err);
    const message = err instanceof Error ? err.message : "Something went wrong while generating content.";
    redirect(`${ADMIN_PATH}/${type}/new?error=${encodeURIComponent(message)}`);
  }
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
    } else if (field.kind === "records") {
      update[field.key] = parseRecordLines(String(formData.get(field.key) ?? ""), field.columns ?? []);
    } else if (field.kind === "coordinates") {
      const lat = parseCoordinate(formData.get("lat"), 90);
      const lng = parseCoordinate(formData.get("lng"), 180);
      // A pin needs both halves, so a half-filled one is saved as no pin at all.
      const placed = lat !== null && lng !== null;
      update.lat = placed ? lat : null;
      update.lng = placed ? lng : null;
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
