import type { RecordColumn } from "./config";

const SEPARATOR = "|";

/**
 * Coerces stored or generated JSON into clean records: only the known columns, trimmed,
 * with any item missing a required column dropped. Tolerates a missing column (undefined).
 */
export function cleanRecords<T>(value: unknown, columns: RecordColumn[]): T[] {
  if (!Array.isArray(value)) return [];

  const records: Record<string, string>[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;

    const record: Record<string, string> = {};
    for (const column of columns) {
      const raw = (item as Record<string, unknown>)[column.key];
      let text = typeof raw === "string" ? raw.trim() : "";
      if (column.options) {
        text = column.options.find((option) => option === text.toLowerCase()) ?? column.options[column.options.length - 1];
      }
      record[column.key] = text;
    }

    if (columns.every((column) => column.optional || record[column.key])) {
      records.push(record);
    }
  }
  return records as T[];
}

/** Parses the Studio's one-item-per-line "a | b | c" text. The last column keeps any extra separators. */
export function parseRecordLines<T>(text: string, columns: RecordColumn[]): T[] {
  const items = text.split("\n").map((line) => {
    const parts = line.split(SEPARATOR);
    const values = [...parts.slice(0, columns.length - 1), parts.slice(columns.length - 1).join(SEPARATOR)];
    return Object.fromEntries(columns.map((column, index) => [column.key, values[index] ?? ""]));
  });
  return cleanRecords<T>(items, columns);
}

export function formatRecordLines(value: unknown, columns: RecordColumn[]): string {
  return cleanRecords<Record<string, string>>(value, columns)
    .map((record) => {
      const parts = columns.map((column) => record[column.key]);
      while (parts.length > 0 && !parts[parts.length - 1]) parts.pop();
      return parts.join(` ${SEPARATOR} `);
    })
    .join("\n");
}
