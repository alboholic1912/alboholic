import "server-only";
import { GoogleGenAI, type Part, type Schema } from "@google/genai";
import type { SourceRecord } from "@/lib/content/types";

// Pinned rather than "-latest": that alias currently resolves to a preview
// model with a very tight free-tier quota (5 requests/minute).
const MODEL = "gemini-3.6-flash";
const YOUTUBE_URL_RE = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/i;

let client: GoogleGenAI | null = null;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Get a free key from https://aistudio.google.com/apikey and add it to .env.local."
    );
  }
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

export type SourceInput =
  | { kind: "text"; label: string; value: string }
  | { kind: "youtube"; url: string }
  | { kind: "file"; file: File };

async function waitForFileActive(name: string) {
  const ai = getClient();
  for (let attempt = 0; attempt < 20; attempt++) {
    const file = await ai.files.get({ name });
    if (file.state === "ACTIVE") return file;
    if (file.state === "FAILED") {
      throw new Error(`Gemini failed to process the uploaded file "${file.displayName ?? name}".`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Timed out waiting for Gemini to finish processing an uploaded file.");
}

export async function buildSourceParts(
  sources: SourceInput[]
): Promise<{ parts: Part[]; record: SourceRecord[] }> {
  const ai = getClient();
  const parts: Part[] = [];
  const record: SourceRecord[] = [];

  for (const source of sources) {
    if (source.kind === "text") {
      parts.push({ text: `--- Source: ${source.label} ---\n${source.value}` });
      record.push({ kind: "text", label: source.label, preview: source.value.slice(0, 200) });
    } else if (source.kind === "youtube") {
      if (!YOUTUBE_URL_RE.test(source.url)) {
        throw new Error(`"${source.url}" doesn't look like a YouTube URL.`);
      }
      parts.push({ fileData: { fileUri: source.url } });
      record.push({ kind: "youtube", url: source.url });
    } else {
      const uploaded = await ai.files.upload({
        file: source.file,
        config: {
          mimeType: source.file.type || "application/pdf",
          displayName: source.file.name,
        },
      });
      const active = await waitForFileActive(uploaded.name!);
      parts.push({ fileData: { fileUri: active.uri!, mimeType: active.mimeType } });
      record.push({ kind: "file", name: source.file.name, mimeType: source.file.type });
    }
  }

  return { parts, record };
}

const GROUNDING_INSTRUCTION =
  "You are a careful research assistant preparing historical content for Alboholic, a site about Albanian history. " +
  "You must use ONLY the information present in the provided sources (text, documents, and videos). " +
  "Do not invent, assume, or add any fact, name, date, quote, or detail that is not directly supported by the sources. " +
  "If the sources do not contain enough information for a field, leave that field as an empty string rather than guessing or fabricating. " +
  "Do not use any outside knowledge you may have, even if you believe it to be true — ground every statement strictly in the given sources. " +
  "Write in clear, engaging, neutral prose suitable for a general audience.";

export async function generateStructuredContent<T>({
  typeInstruction,
  sourceParts,
  responseSchema,
}: {
  typeInstruction: string;
  sourceParts: Part[];
  responseSchema: Schema;
}): Promise<T> {
  if (sourceParts.length === 0) {
    throw new Error("At least one source (text, PDF, or YouTube URL) is required.");
  }

  const ai = getClient();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [...sourceParts, { text: typeInstruction }],
      },
    ],
    config: {
      systemInstruction: GROUNDING_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Gemini returned malformed JSON.");
  }
}
