import { CITATION_TYPES, PERSON_CATEGORIES, PRONOUNS, type ContentType, type ImageTone } from "./types";

// JSON Schema objects sent to Claude as the structured-output format.
type JsonSchema = Record<string, unknown>;

const IMAGE_TONES: ImageTone[] = ["crimson", "amber", "stone", "slate"];

export type FieldKind = "text" | "textarea" | "paragraphs" | "records" | "select" | "checkbox" | "number";

/** One part of a "records" item. Items missing a non-optional part are dropped. */
export interface RecordColumn {
  key: string;
  label: string;
  optional?: boolean;
  /** Restricts the part to these values; anything else becomes the last one. */
  options?: readonly string[];
}

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  /** For "records" fields: the parts of each item, edited as one "a | b | c" line. */
  columns?: RecordColumn[];
  /** Height of the textarea, for the multi-line kinds. */
  rows?: number;
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

/**
 * The structured lists on a person profile, keyed by column. One definition drives the
 * AI schema, the Studio editor and the public page, so all three always agree.
 */
export const PERSON_RECORDS = {
  facts: [
    { key: "label", label: "Label" },
    { key: "value", label: "Value" },
    { key: "detail", label: "Detail", optional: true },
  ],
  significance: [
    { key: "title", label: "Title" },
    { key: "text", label: "Explanation" },
  ],
  timeline: [
    { key: "date", label: "Date" },
    { key: "title", label: "Title" },
    { key: "text", label: "Description", optional: true },
  ],
  related_people: [
    { key: "name", label: "Name" },
    { key: "role", label: "Role", optional: true },
  ],
  related_places: [
    { key: "name", label: "Name" },
    { key: "kind", label: "Kind", optional: true },
  ],
  citations: [
    { key: "type", label: "Type", options: CITATION_TYPES },
    { key: "title", label: "Title" },
    { key: "detail", label: "Detail", optional: true },
    { key: "url", label: "URL", optional: true },
  ],
} satisfies Record<string, RecordColumn[]>;

function recordListSchema(columns: RecordColumn[]): JsonSchema {
  return {
    type: "array",
    items: {
      type: "object",
      properties: Object.fromEntries(
        columns.map((column) => [
          column.key,
          column.options ? { type: "string", enum: column.options } : { type: "string" },
        ])
      ),
      required: columns.map((column) => column.key),
      additionalProperties: false,
    },
  };
}

function recordsHelp(columns: RecordColumn[], example: string): string {
  const format = columns.map((column) => (column.optional ? `${column.label} (optional)` : column.label)).join(" | ");
  return `One per line: ${format}. For example: ${example}`;
}

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
      { key: "body", label: "Body", kind: "paragraphs", helpText: 'One paragraph per line. Start a line with "## " for a section heading or "> " for a pull quote.' },
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
      { key: "category", label: "Category", kind: "select", options: [...PERSON_CATEGORIES] },
      { key: "role", label: "Role", kind: "text", helpText: "A short role, title or affiliation shown as a tag beside the category, e.g. UÇK Commander." },
      { key: "era", label: "Years", kind: "text", helpText: "e.g. 1405 – 1468" },
      { key: "pronoun", label: "Pronoun", kind: "select", options: [...PRONOUNS], helpText: 'Used in headings such as "Why He Matters".' },
      { key: "birthplace", label: "Birthplace / region", kind: "text" },
      { key: "known_for", label: "Known for", kind: "textarea", rows: 2, helpText: "One sentence, shown on cards and in link previews." },
      { key: "bio", label: "Summary", kind: "textarea", helpText: "The 2–3 sentence introduction under the name. Not a biography." },
      {
        key: "facts",
        label: "At a glance",
        kind: "records",
        columns: PERSON_RECORDS.facts,
        helpText: recordsHelp(PERSON_RECORDS.facts, "Born | 1962 | Turiçicë, Podujevë") + " Aim for 5–7.",
      },
      {
        key: "significance",
        label: "Why they matter",
        kind: "records",
        columns: PERSON_RECORDS.significance,
        rows: 5,
        helpText: recordsHelp(PERSON_RECORDS.significance, "Symbol of Resistance | His commitment inspired a generation to join the struggle.") + " Aim for 2–3.",
      },
      {
        key: "timeline",
        label: "Key moments",
        kind: "records",
        columns: PERSON_RECORDS.timeline,
        helpText: recordsHelp(PERSON_RECORDS.timeline, "1962 | Born in Turiçicë | Born in the village of Turiçicë, Podujevë.") + " Aim for 3–6, oldest first.",
      },
      {
        key: "related_stories",
        label: "Stories featuring this person",
        kind: "paragraphs",
        rows: 4,
        helpText: "One story slug per line (the part after /stories/), shown first. Published stories that mention this person by name are added automatically.",
      },
      {
        key: "related_people",
        label: "Associated people",
        kind: "records",
        columns: PERSON_RECORDS.related_people,
        rows: 5,
        helpText: recordsHelp(PERSON_RECORDS.related_people, "Adem Jashari | Freedom Fighter") + " Names that match a published profile become links.",
      },
      {
        key: "related_places",
        label: "Associated places",
        kind: "records",
        columns: PERSON_RECORDS.related_places,
        rows: 5,
        helpText: recordsHelp(PERSON_RECORDS.related_places, "Pestovë | Village"),
      },
      {
        key: "citations",
        label: "Sources / references",
        kind: "records",
        columns: PERSON_RECORDS.citations,
        rows: 5,
        helpText:
          recordsHelp(PERSON_RECORDS.citations, "book | Kosovo: A Short History | Noel Malcolm, 1998 | https://example.org") +
          ` Type is one of: ${CITATION_TYPES.join(", ")}.`,
      },
      { key: "image_tone", label: "Tone", kind: "select", options: IMAGE_TONES },
    ],
    aiInstruction:
      "Produce a profile for the People section. A profile is a concise dossier, not a biography: a reader " +
      "should understand who this person was and why they matter in about 90 seconds, then follow links to " +
      "Stories for what happened. Keep every field short and factual, never retell events in detail, and " +
      "ground everything strictly in the sources above.\n\n" +
      "- name: the person's full name.\n" +
      "- category: the one category that fits best.\n" +
      '- role: a 1-4 word role, title or affiliation shown as a tag beside the category, e.g. "UÇK Commander".\n' +
      '- era: their life span as shown under the name, e.g. "1962 – 1997". Use active years or a period only ' +
      "when the sources give no birth and death years.\n" +
      '- pronoun: the pronoun the sources use for this person, or "they" if the sources do not make it clear.\n' +
      '- birthplace: their place of birth or home region, as short as possible, e.g. "Turiçicë, Podujevë".\n' +
      "- knownFor: one sentence of at most 20 words saying what they are known for. It is shown on cards and " +
      "in link previews.\n" +
      '- bio: a 2-3 sentence introduction answering "who was this person?". It sits under the name and ' +
      "years, so describe who they were rather than what they did year by year, and leave the dates to " +
      "the timeline.\n" +
      '- facts: 5-7 "at a glance" fields. Use these, in this order, wherever the sources support them: ' +
      "Born, Died, Active years, Role, Affiliation, Region. Add or swap in others that suit the person, such " +
      'as Title, Known as or Notable work. Each has a short label and a value of a few words, e.g. label ' +
      '"Born", value "1962". The detail line is only for a place or a brief qualifier that belongs with the ' +
      'value, e.g. "Turiçicë, Podujevë"; leave it empty otherwise. Leave out any field the sources cannot ' +
      "fill, and do not repeat one fact across two fields.\n" +
      '- significance: 2-3 points answering "why should I know this person?". Each has a title of 2-5 words ' +
      "and at most 30 words of text. Explain their significance and legacy; do not narrate their life.\n" +
      "- timeline: 3-6 key moments, oldest first, that give the shape of their life. Each has a date (a year, " +
      'a period such as "1990s", or a short date such as "31 Jan 1997"), a title of a few words, and one ' +
      "sentence of text.\n" +
      "- relatedPeople: up to 5 people the sources closely associate with this person, each with a name and " +
      "a 1-3 word role.\n" +
      "- relatedPlaces: up to 5 places tied to their life, each with a name and its kind, e.g. Village, City, " +
      "Region or Battle site.\n" +
      "- citations: the references the sources themselves identify, such as the title, author and year of a " +
      "supplied document, or works they cite. Each has a type, a title, a detail line (author, publisher, " +
      "year or collection) and a url if one is given. Never invent a reference; return an empty list if the " +
      "sources name none.\n" +
      "- imageTone: the tone that fits the mood.",
    aiSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        category: { type: "string", enum: PERSON_CATEGORIES },
        role: { type: "string" },
        era: { type: "string" },
        pronoun: { type: "string", enum: PRONOUNS },
        birthplace: { type: "string" },
        knownFor: { type: "string" },
        bio: { type: "string" },
        facts: recordListSchema(PERSON_RECORDS.facts),
        significance: recordListSchema(PERSON_RECORDS.significance),
        timeline: recordListSchema(PERSON_RECORDS.timeline),
        relatedStories: { type: "array", items: { type: "string" } },
        relatedPeople: recordListSchema(PERSON_RECORDS.related_people),
        relatedPlaces: recordListSchema(PERSON_RECORDS.related_places),
        citations: recordListSchema(PERSON_RECORDS.citations),
        imageTone: imageToneSchema,
      },
      required: [
        "name",
        "category",
        "role",
        "era",
        "pronoun",
        "birthplace",
        "knownFor",
        "bio",
        "facts",
        "significance",
        "timeline",
        "relatedStories",
        "relatedPeople",
        "relatedPlaces",
        "citations",
        "imageTone",
      ],
      additionalProperties: false,
    },
    defaults: { image_tone: "stone" },
  },
};
