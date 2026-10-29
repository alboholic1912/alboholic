"use client";

import { useState } from "react";
import {
  DEFAULT_IMAGE_PROMPTS,
  IMAGE_MODE_HELP,
  IMAGE_MODE_LABELS,
  IMAGE_MODES,
  type ImageMode,
} from "@/lib/ai/imagePrompts";
import { DEFAULT_IMAGE_MODEL, IMAGE_MODELS } from "@/lib/ai/models";
import styles from "./ImagePromptFields.module.css";

type Props = {
  /** Field wrapper class from the surrounding form, so inputs pick up the Studio styles. */
  fieldClassName: string;
  helpClassName: string;
  defaultMode?: ImageMode;
  /** The prompt last used for `defaultMode`, shown instead of its template. */
  defaultPrompt?: string;
  defaultModel?: string;
  referenceHelp: string;
};

/**
 * Reference image, Recreation/Restoration switch and an editable prompt. Each mode keeps its
 * own text, so switching back and forth never loses an edit.
 */
export default function ImagePromptFields({
  fieldClassName,
  helpClassName,
  defaultMode = "recreation",
  defaultPrompt,
  defaultModel,
  referenceHelp,
}: Props) {
  const [mode, setMode] = useState<ImageMode>(defaultMode);
  const [prompts, setPrompts] = useState<Record<ImageMode, string>>(() => ({
    ...DEFAULT_IMAGE_PROMPTS,
    ...(defaultPrompt ? { [defaultMode]: defaultPrompt } : {}),
  }));

  const prompt = prompts[mode];
  const isDefault = prompt === DEFAULT_IMAGE_PROMPTS[mode];

  return (
    <>
      <div className={fieldClassName}>
        <label htmlFor="referenceImage">Reference image</label>
        <input id="referenceImage" name="referenceImage" type="file" accept="image/png,image/jpeg,image/webp" />
        <span className={helpClassName}>{referenceHelp}</span>
      </div>

      <div className={fieldClassName}>
        <span id="imageModeLabel" className={styles.label}>
          Image style
        </span>
        <div className={styles.switch} role="radiogroup" aria-labelledby="imageModeLabel">
          {IMAGE_MODES.map((option) => (
            <label key={option} className={`${styles.option} ${mode === option ? styles.optionActive : ""}`}>
              <input
                type="radio"
                name="imageMode"
                value={option}
                checked={mode === option}
                onChange={() => setMode(option)}
                className={styles.radio}
              />
              {IMAGE_MODE_LABELS[option]}
            </label>
          ))}
        </div>
        <span className={helpClassName}>{IMAGE_MODE_HELP[mode]}</span>
      </div>

      <div className={fieldClassName}>
        <div className={styles.promptHeader}>
          <label htmlFor="imagePrompt">Image prompt</label>
          {!isDefault && (
            <button
              type="button"
              className={styles.reset}
              onClick={() => setPrompts((current) => ({ ...current, [mode]: DEFAULT_IMAGE_PROMPTS[mode] }))}
            >
              Reset to default
            </button>
          )}
        </div>
        <textarea
          id="imagePrompt"
          name="imagePrompt"
          rows={8}
          value={prompt}
          onChange={(event) => {
            const text = event.target.value;
            setPrompts((current) => ({ ...current, [mode]: text }));
          }}
        />
        <span className={helpClassName}>
          The title and a short scene description written by Claude from the sources are added to this prompt automatically.
        </span>
      </div>

      <div className={fieldClassName}>
        <label htmlFor="imageModel">Generate image with</label>
        <select id="imageModel" name="imageModel" defaultValue={defaultModel ?? DEFAULT_IMAGE_MODEL}>
          {IMAGE_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} — {m.description}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
