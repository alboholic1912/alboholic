"use client";

import { useState, type JSX } from "react";
import {
  DEFAULT_IMAGE_PROMPTS,
  IMAGE_MODE_HELP,
  IMAGE_MODE_LABELS,
  IMAGE_MODES,
  MAX_IMAGE_PROMPT_LENGTH,
  type ImageMode,
} from "@/lib/ai/imagePrompts";
import { DEFAULT_IMAGE_MODEL, IMAGE_MODELS } from "@/lib/ai/models";
import SubmitButton from "@/components/SubmitButton/SubmitButton";
import Dropzone from "./Dropzone";
import styles from "./FeaturedImage.module.css";

type Source = "generate" | "import";

type Props = {
  /** "new" sits inside the Generate form; "edit" is its own form with a submit button. */
  context: "new" | "edit";
  shape: "wide" | "square";
  defaultMode?: ImageMode;
  /** The prompt last used for `defaultMode`, shown instead of its template. */
  defaultPrompt?: string;
  defaultModel?: string;
  /** The reference used last time, offered again on the edit page. */
  previousReferenceUrl?: string | null;
  submitClassName?: string;
};

const SOURCES: { value: Source; label: string; caption: string; icon: () => JSX.Element }[] = [
  { value: "generate", label: "Generate with AI", caption: "OpenAI makes it from the sources", icon: SparkIcon },
  { value: "import", label: "Import image", caption: "Upload a finished image as it is", icon: ImportIcon },
];

/**
 * The featured-image controls: a Generate/Import switch, then either the AI options (optional
 * reference, Recreation/Restoration, prompt and model) or a plain upload. Both panels stay
 * mounted so switching never loses a chosen file or an edited prompt.
 */
export default function FeaturedImageFields({
  context,
  shape,
  defaultMode = "recreation",
  defaultPrompt,
  defaultModel,
  previousReferenceUrl,
  submitClassName,
}: Props) {
  const [source, setSource] = useState<Source>("generate");
  const [mode, setMode] = useState<ImageMode>(defaultMode);
  const [prompts, setPrompts] = useState<Record<ImageMode, string>>(() => ({
    ...DEFAULT_IMAGE_PROMPTS,
    ...(defaultPrompt ? { [defaultMode]: defaultPrompt } : {}),
  }));
  const [hasNewReference, setHasNewReference] = useState(false);
  const [reusePrevious, setReusePrevious] = useState(Boolean(previousReferenceUrl));

  const prompt = prompts[mode];
  const isDefaultPrompt = prompt === DEFAULT_IMAGE_PROMPTS[mode];
  const hasReference = hasNewReference || (reusePrevious && Boolean(previousReferenceUrl));

  return (
    <div className={styles.fields}>
      <input type="hidden" name="imageSource" value={source} />

      <div className={styles.sourceSwitch} role="radiogroup" aria-label="How to add the image">
        {SOURCES.map(({ value, label, caption, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={source === value}
            className={`${styles.sourceOption} ${source === value ? styles.sourceActive : ""}`}
            onClick={() => setSource(value)}
          >
            <span className={styles.sourceIcon}>
              <Icon />
            </span>
            <span className={styles.sourceText}>
              <span className={styles.sourceLabel}>{label}</span>
              <span className={styles.sourceCaption}>{caption}</span>
            </span>
          </button>
        ))}
      </div>

      <div hidden={source !== "generate"} className={styles.panel}>
        {reusePrevious && previousReferenceUrl && <input type="hidden" name="reuseReference" value="on" />}

        <div className={styles.generateGrid}>
          <Dropzone
            name="referenceImage"
            label="Reference image"
            tag="Optional"
            emptyText="A real photo, painting or map"
            help="Without one, the image is drawn from the prompt and the sources alone."
            accept="image/png,image/jpeg,image/webp"
            shape={shape}
            existing={
              reusePrevious && previousReferenceUrl
                ? { url: previousReferenceUrl, caption: "Reference used last time", onRemove: () => setReusePrevious(false) }
                : null
            }
            onFileChange={setHasNewReference}
          />

          <div className={styles.optionsColumn}>
            <div className={styles.field}>
              <span className={styles.fieldLabel} id="imageModeLabel">
                Style
              </span>
              <div className={styles.modeSwitch} role="radiogroup" aria-labelledby="imageModeLabel">
                {IMAGE_MODES.map((option) => (
                  <label key={option} className={`${styles.modeOption} ${mode === option ? styles.modeActive : ""}`}>
                    <input
                      type="radio"
                      name="imageMode"
                      value={option}
                      checked={mode === option}
                      onChange={() => setMode(option)}
                      className={styles.visuallyHidden}
                    />
                    {IMAGE_MODE_LABELS[option]}
                  </label>
                ))}
              </div>
              <p className={styles.help}>{IMAGE_MODE_HELP[mode]}</p>
              {mode === "restoration" && !hasReference && (
                <p className={styles.warning}>Restoration needs a reference image to restore.</p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="imageModel" className={styles.fieldLabel}>
                Model
              </label>
              <select
                id="imageModel"
                name="imageModel"
                className={styles.select}
                defaultValue={defaultModel ?? DEFAULT_IMAGE_MODEL}
              >
                {IMAGE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} — {m.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <label htmlFor="imagePrompt" className={styles.fieldLabel}>
              Prompt · {IMAGE_MODE_LABELS[mode]}
            </label>
            {!isDefaultPrompt && (
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => setPrompts((current) => ({ ...current, [mode]: DEFAULT_IMAGE_PROMPTS[mode] }))}
              >
                Reset to default
              </button>
            )}
          </div>
          <textarea
            id="imagePrompt"
            name="imagePrompt"
            rows={7}
            className={styles.textarea}
            value={prompt}
            maxLength={MAX_IMAGE_PROMPT_LENGTH}
            onChange={(event) => {
              const text = event.target.value;
              setPrompts((current) => ({ ...current, [mode]: text }));
            }}
          />
          <p className={styles.help}>
            The title and a short scene description Claude writes from the sources are added automatically.
          </p>
        </div>
      </div>

      <div hidden={source !== "import"} className={styles.panel}>
        <Dropzone
          name="importImage"
          label="Image"
          emptyText="Your finished featured image"
          help={
            context === "new"
              ? "Uploaded exactly as it is. Leave it empty to add an image later."
              : "Uploaded exactly as it is, replacing the current image."
          }
          accept="image/*"
          shape={shape}
        />
      </div>

      {context === "edit" && submitClassName && (
        <div className={styles.submitRow}>
          <SubmitButton className={submitClassName} pendingText={source === "generate" ? "Starting…" : "Uploading…"}>
            {source === "generate" ? "Generate image" : "Upload image"}
          </SubmitButton>
          {source === "generate" && <span className={styles.help}>Roughly $0.17 per image with GPT Image 2.</span>}
        </div>
      )}
    </div>
  );
}

function SparkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20.5 15.5l-5-5-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
