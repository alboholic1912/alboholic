/**
 * The two ways the Studio turns a reference image into a featured image. Shared by the
 * Studio forms (which prefill the prompt box) and the server (which validates the mode).
 */
export const IMAGE_MODES = ["recreation", "restoration"] as const;
export type ImageMode = (typeof IMAGE_MODES)[number];

export function isImageMode(value: unknown): value is ImageMode {
  return typeof value === "string" && (IMAGE_MODES as readonly string[]).includes(value);
}

export const IMAGE_MODE_LABELS: Record<ImageMode, string> = {
  recreation: "Recreation",
  restoration: "Restoration",
};

export const IMAGE_MODE_HELP: Record<ImageMode, string> = {
  recreation: "Uses the reference as inspiration and rebuilds the scene as a cinematic film still.",
  restoration: "Keeps the reference as it is, restoring its quality and adding only restrained detail.",
};

export const DEFAULT_IMAGE_PROMPTS: Record<ImageMode, string> = {
  recreation:
    "Create a cinematic, photorealistic historical image in Alboholic’s signature style: dark, dramatic atmosphere, " +
    "realistic textures, muted earthy colors, natural lighting, and epic historical detail. Use the reference image " +
    "as inspiration, not a strict template. Faithfully reconstruct the subject and era, creatively filling in missing " +
    "details with historically plausible clothing, surroundings, landscapes, and subtle Albanian historical elements " +
    "where appropriate. The result should feel like a frame from a high-budget historical film, powerful and " +
    "believable, never fantasy-like. No text, captions, watermarks, or modern objects.",
  restoration:
    "Enhance the reference into a cinematic, photorealistic Alboholic-style historical image. Preserve the person’s " +
    "real identity, facial features, age, expression, pose, and recognizable clothing. Restore image quality, improve " +
    "realistic detail, lighting, contrast, and depth, using muted earthy colors and a subtle dramatic atmosphere. Add " +
    "only restrained, historically accurate environmental details inspired by the story, without changing the " +
    "original scene unnecessarily. The result should look authentic, not AI-stylized. No text, captions, watermarks, " +
    "or modern objects unless historically appropriate.",
};

/** Prompts longer than this are rejected; the image models accept far more, but a prompt this long is a paste error. */
export const MAX_IMAGE_PROMPT_LENGTH = 6000;
