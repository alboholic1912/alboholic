import "server-only";
import OpenAI, { toFile } from "openai";
import type { ContentType } from "@/lib/content/types";
import type { ImageMode } from "./imagePrompts";
import { getImageModel } from "./models";
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

const IMAGE_QUALITY = "high" as const;

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

/** Edits the reference image when there is one, otherwise draws the image from the prompt alone. */
export async function generateFeaturedImage({
  model,
  type,
  mode,
  prompt,
  reference,
}: {
  model: string;
  type: ContentType;
  mode: ImageMode;
  prompt: string;
  reference: ReferenceImage | null;
}): Promise<{ bytes: Buffer; mimeType: string; extension: string; usage: UsageInfo }> {
  if (!getImageModel(model)) {
    throw new Error("Unknown image model.");
  }
  const ai = getClient();
  const common = {
    model,
    prompt,
    size: IMAGE_SIZES[type],
    quality: IMAGE_QUALITY,
    output_format: "webp" as const,
  };

  let response: OpenAI.ImagesResponse;
  try {
    response = reference
      ? await ai.images.edit({
          ...common,
          image: await toFile(reference.bytes, reference.name, { type: reference.mimeType }),
          // Restoration has to keep the real face; recreation is free to reinterpret it.
          ...(mode === "restoration" && FIDELITY_MODELS.has(model) ? { input_fidelity: "high" as const } : {}),
        })
      : await ai.images.generate(common);
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
      model,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    },
  };
}
