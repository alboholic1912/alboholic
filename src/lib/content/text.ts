/** Lowercases and strips diacritics, so "Skënderbeu" and "Skenderbeu" compare equal. */
export function fold(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
