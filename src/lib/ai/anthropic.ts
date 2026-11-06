import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { MAX_OUTPUT_TOKENS, type GenerateRequest, type UsageInfo } from "./generate";

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

/** Returns Claude's JSON text; generate.ts parses it. */
export async function generateWithClaude({
  model,
  system,
  typeInstruction,
  parts,
  jsonSchema,
}: GenerateRequest): Promise<{ text: string; usage: UsageInfo }> {
  const sourceBlocks: Anthropic.ContentBlockParam[] = parts.map((part) =>
    part.kind === "pdf"
      ? { type: "document", title: part.name, source: { type: "base64", media_type: "application/pdf", data: part.data } }
      : { type: "text", text: part.text }
  );

  let response: Anthropic.Message;
  try {
    response = await getClient().messages.create({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system,
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
  return { text: textBlock.text, usage };
}
