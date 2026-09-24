import { Type, type Schema } from "@google/genai";
import type { ContentType, ImageTone } from "./types";

const IMAGE_TONES: ImageTone[] = ["crimson", "amber", "stone", "slate"];

export type FieldKind = "text" | "textarea" | "paragraphs" | "select" | "checkbox" | "number";

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  helpText?: string;
}

export interface ContentTypeConfig {
  type: ContentType;
  label: string;
  labelPlural: string;
  /** Column used as the display title in lists and as the slug source. */
  titleField: string;
  /** Fields shown on the review/edit page, in order. */
  fields: FieldDef[];
  /** Instruction appended after the sources, telling Gemini what to produce. */
  aiInstruction: string;
  /** JSON schema Gemini must return. */
  aiSchema: Schema;
  /** Default row values for a freshly generated item, before the AI output is merged in. */
  defaults: Record<string, unknown>;
}

const imageToneSchema: Schema = {
  type: Type.STRING,
  enum: IMAGE_TONES,
  description: "The mood/color tone that best fits this content.",
};

export const CONTENT_CONFIG: Record<ContentType, ContentTypeConfig> = {
  stories: {
    type: "stories",
    label: "Story",
    labelPlural: "Stories",
    titleField: "title",
    fields: [
      { key: "title", label: "Title", kind: "text" },
      { key: "category", label: "Category", kind: "text" },
      { key: "excerpt", label: "Excerpt", kind: "textarea" },
      { key: "body", label: "Body", kind: "paragraphs", helpText: "One paragraph per line." },
      { key: "credit", label: "Image credit", kind: "text" },
      { key: "image_tone", label: "Tone", kind: "select", options: IMAGE_TONES },
      { key: "featured", label: "Featured on homepage", kind: "checkbox" },
      { key: "ai_image", label: "Featured image is AI-generated", kind: "checkbox" },
    ],
    aiInstruction:
      "Produce a story for the Stories section: a category label, a compelling title, a one-to-two " +
      "sentence excerpt, and a body made of 3-6 paragraphs telling the story in full, all grounded strictly " +
      "in the sources above. Also suggest an image_tone that fits the mood.",
    aiSchema: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING },
        title: { type: Type.STRING },
        excerpt: { type: Type.STRING },
        body: { type: Type.ARRAY, items: { type: Type.STRING } },
        imageTone: imageToneSchema,
      },
      required: ["category", "title", "excerpt", "body", "imageTone"],
    },
    defaults: { ai_image: false, featured: false, image_tone: "stone", date: new Date().toISOString().slice(0, 10) },
  },
  people: {
    type: "people",
    label: "Person",
    labelPlural: "People",
    titleField: "name",
    fields: [
      { key: "name", label: "Name", kind: "text" },
      { key: "role", label: "Role", kind: "text" },
      { key: "era", label: "Era", kind: "text", helpText: "e.g. 1405 – 1468" },
      { key: "bio", label: "Bio", kind: "textarea" },
      { key: "image_tone", label: "Tone", kind: "select", options: IMAGE_TONES },
    ],
    aiInstruction:
      "Produce an entry for the People section: full name, their role/title, their era (birth-death or " +
      "active years, as given in the sources), and a short bio of 2-4 sentences, grounded strictly in the " +
      "sources above. Also suggest an image_tone that fits the mood.",
    aiSchema: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        role: { type: Type.STRING },
        era: { type: Type.STRING },
        bio: { type: Type.STRING },
        imageTone: imageToneSchema,
      },
      required: ["name", "role", "era", "bio", "imageTone"],
    },
    defaults: { image_tone: "stone" },
  },
  periods: {
    type: "periods",
    label: "Period",
    labelPlural: "Periods",
    titleField: "name",
    fields: [
      { key: "name", label: "Name", kind: "text" },
      { key: "range", label: "Date range", kind: "text", helpText: "e.g. 1405 – 1468" },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "sort_order", label: "Sort order", kind: "number" },
    ],
    aiInstruction:
      "Produce an entry for the Periods section: a short period name, its date range as given in the " +
      "sources, and a one-to-two sentence description, grounded strictly in the sources above.",
    aiSchema: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        range: { type: Type.STRING },
        description: { type: Type.STRING },
      },
      required: ["name", "range", "description"],
    },
    defaults: { sort_order: 0 },
  },
  places: {
    type: "places",
    label: "Place",
    labelPlural: "Places",
    titleField: "name",
    fields: [
      { key: "name", label: "Name", kind: "text" },
      { key: "region", label: "Region", kind: "text" },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "image_tone", label: "Tone", kind: "select", options: IMAGE_TONES },
    ],
    aiInstruction:
      "Produce an entry for the Places section: place name, its region, and a one-to-two sentence " +
      "description, grounded strictly in the sources above. Also suggest an image_tone that fits the mood.",
    aiSchema: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        region: { type: Type.STRING },
        description: { type: Type.STRING },
        imageTone: imageToneSchema,
      },
      required: ["name", "region", "description", "imageTone"],
    },
    defaults: { image_tone: "stone" },
  },
};
