// Body lines are plain paragraphs, except "## " starts a section heading and "> " a pull quote.
export function BodyBlock({ text }: { text: string }) {
  if (text.startsWith("## ")) {
    return <h2>{text.slice(3)}</h2>;
  }

  if (text.startsWith("> ")) {
    return <blockquote>{text.slice(2)}</blockquote>;
  }

  return <p>{text}</p>;
}
