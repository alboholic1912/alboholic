import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { SourceRecord } from "@/lib/content/types";
import { getAiModel } from "./models";

let client: Anthropic | null = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Create a key at https://console.anthropic.com/settings/keys and add it to .env.local."
    );
  }
  // The SDK retries 408/409/429/5xx (incl. 529 overloaded) with backoff.
  client ??= new Anthropic({ maxRetries: 3 });
  return client;
}

export type SourceInput =
  | { kind: "text"; label: string; value: string }
  | { kind: "file"; file: File };

export interface UsageInfo {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

const MAX_OUTPUT_TOKENS = 8192;

export async function buildSourceBlocks(
  sources: SourceInput[]
): Promise<{ blocks: Anthropic.ContentBlockParam[]; record: SourceRecord[] }> {
  const blocks: Anthropic.ContentBlockParam[] = [];
  const record: SourceRecord[] = [];

  for (const source of sources) {
    if (source.kind === "text") {
      blocks.push({ type: "text", text: `--- Source: ${source.label} ---\n${source.value}` });
      record.push({ kind: "text", label: source.label, preview: source.value.slice(0, 200) });
      continue;
    }

    const { file } = source;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      const data = Buffer.from(await file.arrayBuffer()).toString("base64");
      blocks.push({
        type: "document",
        title: file.name,
        source: { type: "base64", media_type: "application/pdf", data },
      });
      record.push({ kind: "file", name: file.name, mimeType: "application/pdf" });
    } else {
      const text = await file.text();
      blocks.push({ type: "text", text: `--- Source: ${file.name} ---\n${text}` });
      record.push({ kind: "file", name: file.name, mimeType: file.type || "text/plain" });
    }
  }

  return { blocks, record };
}

const GROUNDING_INSTRUCTION =
  "You are a careful research assistant preparing historical content for Alboholic, a site about Albanian history. " +
  "You must use ONLY the information present in the provided sources (text and documents). " +
  "Do not invent, assume, or add any fact, name, date, quote, or detail that is not directly supported by the sources. " +
  "If the sources do not contain enough information for a field, leave that field as an empty string rather than guessing or fabricating. " +
  "Do not use any outside knowledge you may have, even if you believe it to be true — ground every statement strictly in the given sources. " +
  "Write in clear, engaging, neutral prose suitable for a general audience.";

export async function generateStructuredContent<T>({
  model,
  typeInstruction,
  sourceBlocks,
  jsonSchema,
}: {
  model: string;
  typeInstruction: string;
  sourceBlocks: Anthropic.ContentBlockParam[];
  jsonSchema: Record<string, unknown>;
}): Promise<{ data: T; usage: UsageInfo }> {
  if (sourceBlocks.length === 0) {
    throw new Error("At least one source (text or PDF) is required.");
  }
  if (!getAiModel(model)) {
    throw new Error("Unknown AI model.");
  }

  const ai = getClient();

  let response: Anthropic.Message;
  try {
    response = await ai.messages.create({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: GROUNDING_INSTRUCTION,
      messages: [{ role: "user", content: [...sourceBlocks, { type: "text", text: typeInstruction }] }],
      output_config: {
        format: { type: "json_schema", schema: jsonSchema },
        // Sonnet 5.5 thinks by default; keep it modest since the task is
        // summarising supplied sources. Haiku 4.5 rejects `effort`.
        ...(model === "claude-sonnet-5-5" ? { effort: "medium" as const } : {}),
      },
    });
  } catch (err) {
    console.error("[anthropic] Generating content failed:", err);
    const detail =
      err instanceof Anthropic.APIError
        ? `Anthropic API error ${err.status ?? ""}: ${err.message}`
        : err instanceof Error
          ? err.message
          : String(err);
    throw new Error(`Generating content with Claude failed — ${detail}`);
  }

  const usage: UsageInfo = {
    model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
  };

  if (response.stop_reason === "refusal") {
    console.error("[anthropic] Refusal.", response.stop_details);
    throw new Error("Claude declined to generate this content from the given sources.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("The generated content was cut off (too long). Try fewer or shorter sources.");
  }

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock?.text) {
    console.error("[anthropic] Empty response.", { stopReason: response.stop_reason });
    throw new Error("Claude returned an empty response.");
  }

  try {
    return { data: JSON.parse(textBlock.text) as T, usage };
  } catch (err) {
    console.error("[anthropic] Malformed JSON response:", textBlock.text.slice(0, 2000), err);
    throw new Error("Claude returned malformed JSON.");
  }
}
