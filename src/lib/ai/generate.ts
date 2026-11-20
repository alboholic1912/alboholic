import "server-only";
import { generateWithClaude } from "./anthropic";
import { generateWithOpenAI } from "./openai";
import { getAiModel } from "./models";
import type { SourcePart } from "./sources";

export interface UsageInfo {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

/** What each provider gets: the same prompt, sources and schema. */
export interface GenerateRequest {
  model: string;
  system: string;
  typeInstruction: string;
  parts: SourcePart[];
  jsonSchema: Record<string, unknown>;
}

export const MAX_OUTPUT_TOKENS = 8192;

const GROUNDING_INSTRUCTION =
  "You are a careful research assistant preparing historical content for Alboholic, a site about Albanian history. " +
  "You must use ONLY the information present in the provided sources (text and documents). " +
  "Do not invent, assume, or add any fact, name, date, quote, or detail that is not directly supported by the sources. " +
  "If the sources do not contain enough information for a field, leave that field as an empty string rather than guessing or fabricating. " +
  "Do not use any outside knowledge you may have, even if you believe it to be true — ground every statement strictly in the given sources. " +
  "Write in clear, engaging, neutral prose suitable for a general audience.";

/** Generates structured content with Claude or OpenAI, depending on the chosen model. */
export async function generateStructuredContent<T>({
  model,
  system = GROUNDING_INSTRUCTION,
  typeInstruction,
  parts,
  jsonSchema,
}: Omit<GenerateRequest, "system"> & { system?: string }): Promise<{ data: T; usage: UsageInfo }> {
  if (parts.length === 0) {
    throw new Error("At least one source (text or PDF) is required.");
  }
  const info = getAiModel(model);
  if (!info) {
    throw new Error("Unknown AI model.");
  }

  const request = { model, system, typeInstruction, parts, jsonSchema };
  const { text, usage } =
    info.provider === "openai" ? await generateWithOpenAI(request) : await generateWithClaude(request);

  try {
    return { data: JSON.parse(text) as T, usage };
  } catch (err) {
    console.error(`[generate] ${model} returned malformed JSON:`, text.slice(0, 2000), err);
    throw new Error(`${info.label} returned malformed JSON.`);
  }
}
