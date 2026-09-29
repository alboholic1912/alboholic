import type { ContentType, ImageTone } from "./types";

// JSON Schema objects sent to Claude as the structured-output format.
type JsonSchema = Record<string, unknown>;

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
  /** Instruction appended after the sources, telling Claude what to produce. */
  aiInstruction: string;
  /** JSON schema Claude must return. */
  aiSchema: JsonSchema;
  /** Default row values for a freshly generated item, before the AI output is merged in. */
  defaults: Record<string, unknown>;
}

const imageToneSchema: JsonSchema = {
  type: "string",
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
      type: "object",
      properties: {
        category: { type: "string" },
        title: { type: "string" },
        excerpt: { type: "string" },
        body: { type: "array", items: { type: "string" } },
        imageTone: imageToneSchema,
      },
      required: ["category", "title", "excerpt", "body", "imageTone"],
      additionalProperties: false,
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
      type: "object",
      properties: {
        name: { type: "string" },
        role: { type: "string" },
        era: { type: "string" },
        bio: { type: "string" },
        imageTone: imageToneSchema,
      },
      required: ["name", "role", "era", "bio", "imageTone"],
      additionalProperties: false,
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
      type: "object",
      properties: {
        name: { type: "string" },
        range: { type: "string" },
        description: { type: "string" },
      },
      required: ["name", "range", "description"],
      additionalProperties: false,
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
      type: "object",
      properties: {
        name: { type: "string" },
        region: { type: "string" },
        description: { type: "string" },
        imageTone: imageToneSchema,
      },
      required: ["name", "region", "description", "imageTone"],
      additionalProperties: false,
    },
    defaults: { image_tone: "stone" },
  },
};
