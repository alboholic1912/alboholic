export interface AiModel {
  id: string;
  label: string;
  description: string;
  /** USD per million tokens (Anthropic first-party API pricing). */
  inputPerMTok: number;
  outputPerMTok: number;
}

export const AI_MODELS: AiModel[] = [
  {
    id: "claude-haiku-4-5",
    label: "Haiku 4.5",
    description: "Fast and cheap",
    inputPerMTok: 1,
    outputPerMTok: 5,
  },
  {
    id: "claude-sonnet-5-5",
    label: "Sonnet 5.5",
    description: "Better writing, costs about 2x",
    inputPerMTok: 2,
    outputPerMTok: 10,
  },
];

export const DEFAULT_AI_MODEL = AI_MODELS[0].id;

export function getAiModel(id: string): AiModel | undefined {
  return AI_MODELS.find((m) => m.id === id);
}

/**
 * OpenAI image models for featured images. Prices are OpenAI's per-1M-token rates; input uses the
 * image-input rate, since the reference image is nearly all of it (the prompt is a few hundred tokens).
 */
export const IMAGE_MODELS: AiModel[] = [
  {
    id: "gpt-image-2",
    label: "GPT Image 2",
    description: "Reliable default",
    inputPerMTok: 8,
    outputPerMTok: 30,
  },
  {
    id: "gpt-image-2.5-flare",
    label: "GPT Image 2.5 Flare",
    description: "Newer and faster",
    inputPerMTok: 8,
    outputPerMTok: 30,
  },
  {
    id: "gpt-image-2.5-sunburst",
    label: "GPT Image 2.5 Sunburst",
    description: "Most precise edits, slower",
    inputPerMTok: 8,
    outputPerMTok: 30,
  },
  {
    id: "gpt-image-1.5",
    label: "GPT Image 1.5",
    description: "Keeps faces closest in Restoration",
    inputPerMTok: 8,
    outputPerMTok: 32,
  },
  {
    id: "gpt-image-1-mini",
    label: "GPT Image 1 Mini",
    description: "Cheapest, lower quality",
    inputPerMTok: 2.5,
    outputPerMTok: 8,
  },
];

export const DEFAULT_IMAGE_MODEL = IMAGE_MODELS[0].id;

export function getImageModel(id: string): AiModel | undefined {
  return IMAGE_MODELS.find((m) => m.id === id);
}

/** Any model the usage log may name, Claude or OpenAI. */
export function getAnyModel(id: string): AiModel | undefined {
  return getAiModel(id) ?? getImageModel(id);
}

export function estimateCostUsd(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = getAnyModel(modelId);
  if (!model) return 0;
  return (inputTokens * model.inputPerMTok + outputTokens * model.outputPerMTok) / 1_000_000;
}
