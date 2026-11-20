import "server-only";
import OpenAI from "openai";
import { MAX_OUTPUT_TOKENS, type GenerateRequest, type UsageInfo } from "./generate";

let client: OpenAI | null = null;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Create a key at https://platform.openai.com/api-keys and add it to .env.local."
    );
  }
  // The SDK retries 408/409/429/5xx with backoff.
  client ??= new OpenAI({ maxRetries: 3 });
  return client;
}

/** Returns the model's JSON text; generate.ts parses it. */
export async function generateWithOpenAI({
  model,
  system,
  typeInstruction,
  parts,
  jsonSchema,
}: GenerateRequest): Promise<{ text: string; usage: UsageInfo }> {
  const content: OpenAI.Responses.ResponseInputContent[] = parts.map((part) =>
    part.kind === "pdf"
      ? { type: "input_file", filename: part.name, file_data: `data:application/pdf;base64,${part.data}` }
      : { type: "input_text", text: part.text }
  );

  let response: OpenAI.Responses.Response;
  try {
    response = await getClient().responses.create({
      model,
      instructions: system,
      input: [{ role: "user", content: [...content, { type: "input_text", text: typeInstruction }] }],
      text: { format: { type: "json_schema", name: "content", schema: jsonSchema, strict: true } },
      // Low effort keeps generations inside the page's one-minute limit; the task is
      // summarising supplied sources, not hard reasoning.
      reasoning: { effort: "low" },
      max_output_tokens: MAX_OUTPUT_TOKENS,
    });
  } catch (err) {
    console.error("[openai] Generating content failed:", err);
    const detail =
      err instanceof OpenAI.APIError
        ? `OpenAI API error ${err.status ?? ""}: ${err.message}`
        : err instanceof Error
          ? err.message
          : String(err);
    throw new Error(`Generating content with OpenAI failed — ${detail}`);
  }

  const cached = response.usage?.input_tokens_details?.cached_tokens ?? 0;
  const usage: UsageInfo = {
    model,
    inputTokens: (response.usage?.input_tokens ?? 0) - cached,
    outputTokens: response.usage?.output_tokens ?? 0,
    cacheReadTokens: cached,
    cacheWriteTokens: 0,
  };

  const refusal = response.output
    .flatMap((item) => (item.type === "message" ? item.content : []))
    .find((c) => c.type === "refusal");
  if (refusal) {
    console.error("[openai] Refusal:", refusal.refusal);
    throw new Error("OpenAI declined to generate this content from the given sources.");
  }
  if (response.status === "incomplete") {
    if (response.incomplete_details?.reason === "max_output_tokens") {
      throw new Error("The generated content was cut off (too long). Try fewer or shorter sources.");
    }
    throw new Error(`OpenAI stopped early (${response.incomplete_details?.reason ?? "unknown reason"}).`);
  }

  if (!response.output_text) {
    console.error("[openai] Empty response.", { status: response.status });
    throw new Error("OpenAI returned an empty response.");
  }
  return { text: response.output_text, usage };
}
