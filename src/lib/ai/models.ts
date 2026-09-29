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

export function estimateCostUsd(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = getAiModel(modelId);
  if (!model) return 0;
  return (inputTokens * model.inputPerMTok + outputTokens * model.outputPerMTok) / 1_000_000;
}
