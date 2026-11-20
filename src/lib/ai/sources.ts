import "server-only";
import type { SourceRecord } from "@/lib/content/types";

export type SourceInput =
  | { kind: "text"; label: string; value: string }
  | { kind: "file"; file: File };

/** A source ready to send to any provider: plain text, or a PDF as base64. */
export type SourcePart =
  | { kind: "text"; text: string }
  | { kind: "pdf"; name: string; data: string };

/** Reads the uploaded sources once, so either provider can use them. */
export async function buildSourceParts(
  sources: SourceInput[]
): Promise<{ parts: SourcePart[]; record: SourceRecord[] }> {
  const parts: SourcePart[] = [];
  const record: SourceRecord[] = [];

  for (const source of sources) {
    if (source.kind === "text") {
      parts.push({ kind: "text", text: `--- Source: ${source.label} ---\n${source.value}` });
      record.push({ kind: "text", label: source.label, preview: source.value.slice(0, 200) });
      continue;
    }

    const { file } = source;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      const data = Buffer.from(await file.arrayBuffer()).toString("base64");
      parts.push({ kind: "pdf", name: file.name, data });
      record.push({ kind: "file", name: file.name, mimeType: "application/pdf" });
    } else {
      const text = await file.text();
      parts.push({ kind: "text", text: `--- Source: ${file.name} ---\n${text}` });
      record.push({ kind: "file", name: file.name, mimeType: file.type || "text/plain" });
    }
  }

  return { parts, record };
}
