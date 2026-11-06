export type AiProvider = "anthropic" | "openai";

export interface AiModel {
  id: string;
  label: string;
  description: string;
  provider: AiProvider;
  /** USD per million tokens, standard API pricing. */
  inputPerMTok: number;
  outputPerMTok: number;
}

export const AI_MODELS: AiModel[] = [
  {
    id: "claude-haiku-4-5",
    label: "Haiku 4.5",
    description: "Fast and cheap",
    provider: "anthropic",
    inputPerMTok: 1,
    outputPerMTok: 5,
  },
  {
    id: "claude-sonnet-5-5",
    label: "Sonnet 5.5",
    description: "Better writing, costs about 2x",
    provider: "anthropic",
    inputPerMTok: 2,
    outputPerMTok: 10,
  },
  {
    id: "gpt-6.1-sol",
    label: "GPT-6.1 Sol",
    description: "OpenAI's best writing, priced like Sonnet",
    provider: "openai",
    inputPerMTok: 2,
    outputPerMTok: 10,
  },
  {
    id: "gpt-6.1-terra",
    label: "GPT-6.1 Terra",
    description: "Good and about half the price of Sol",
    provider: "openai",
    inputPerMTok: 1,
    outputPerMTok: 5,
  },
  {
    id: "gpt-6-luna",
    label: "GPT-6 Luna",
    description: "Cheapest, for quick drafts",
    provider: "openai",
    inputPerMTok: 0.1,
    outputPerMTok: 0.5,
  },
];

export const AI_PROVIDER_LABELS: Record<AiProvider, string> = {
  anthropic: "Anthropic (Claude)",
  openai: "OpenAI",
};

export const DEFAULT_AI_MODEL = AI_MODELS[0].id;

export function getAiModel(id: string): AiModel | undefined {
  return AI_MODELS.find((m) => m.id === id);
}

/**
 * OpenAI image models the Studio used to make featured images with. No longer used; kept only so
 * past image generations in the usage log still show their name and cost.
 */
const PAST_IMAGE_MODELS: Omit<AiModel, "provider">[] = [
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

/** Any model the usage log may name, Claude or (past) OpenAI. */
export function getAnyModel(id: string): Omit<AiModel, "provider"> | undefined {
  return getAiModel(id) ?? PAST_IMAGE_MODELS.find((m) => m.id === id);
}

export function estimateCostUsd(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = getAnyModel(modelId);
  if (!model) return 0;
  return (inputTokens * model.inputPerMTok + outputTokens * model.outputPerMTok) / 1_000_000;
}
