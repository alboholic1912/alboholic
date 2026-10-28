import "server-only";
import OpenAI, { toFile } from "openai";
import type { ContentType } from "@/lib/content/types";
import type { ImageMode } from "./imagePrompts";
import type { UsageInfo } from "./anthropic";

let client: OpenAI | null = null;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Create a key at https://platform.openai.com/api-keys and add it to .env.local."
    );
  }
  // Image edits regularly take 30-90s; the SDK retries 408/409/429/5xx with backoff.
  client ??= new OpenAI({ maxRetries: 2, timeout: 240_000 });
  return client;
}

/** Overridable so a newer model can be tried without a code change. */
export const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
const IMAGE_QUALITY = "high";

// Stories and battles show wide 3:2 frames; people are cropped to 4:5 cards and 4:3 headers, so square suits both.
const IMAGE_SIZES: Record<ContentType, "1536x1024" | "1024x1024"> = {
  stories: "1536x1024",
  battles: "1536x1024",
  people: "1024x1024",
};

/** Only these models accept `input_fidelity`; gpt-image-2 and later reject it. */
const FIDELITY_MODELS = new Set(["gpt-image-1", "gpt-image-1.5"]);

export interface ReferenceImage {
  bytes: Buffer;
  name: string;
  mimeType: string;
}

export async function generateImageFromReference({
  type,
  mode,
  prompt,
  reference,
}: {
  type: ContentType;
  mode: ImageMode;
  prompt: string;
  reference: ReferenceImage;
}): Promise<{ bytes: Buffer; mimeType: string; extension: string; usage: UsageInfo }> {
  const ai = getClient();

  let response: OpenAI.ImagesResponse;
  try {
    response = await ai.images.edit({
      model: IMAGE_MODEL,
      image: await toFile(reference.bytes, reference.name, { type: reference.mimeType }),
      prompt,
      size: IMAGE_SIZES[type],
      quality: IMAGE_QUALITY,
      output_format: "webp",
      // Restoration has to keep the real face; recreation is free to reinterpret it.
      ...(mode === "restoration" && FIDELITY_MODELS.has(IMAGE_MODEL) ? { input_fidelity: "high" as const } : {}),
    });
  } catch (err) {
    console.error("[openai] Generating image failed:", err);
    const detail =
      err instanceof OpenAI.APIError
        ? `OpenAI API error ${err.status ?? ""}: ${err.message}`
        : err instanceof Error
          ? err.message
          : String(err);
    throw new Error(`Generating the image failed — ${detail}`);
  }

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI returned no image.");
  }

  return {
    bytes: Buffer.from(b64, "base64"),
    mimeType: "image/webp",
    extension: "webp",
    usage: {
      model: IMAGE_MODEL,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    },
  };
}
