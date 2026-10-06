import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import type { IdeaRow } from "@/lib/content/types";
import BackLink from "@/components/BackLink/BackLink";
import SubmitButton from "@/components/SubmitButton/SubmitButton";
import { createIdea, updateIdea, updateIdeaStatus, deleteIdea } from "./actions";
import styles from "./ideas.module.css";

export const metadata: Metadata = {
  title: "Ideas — Studio",
  robots: { index: false, follow: false },
};

type Kind = IdeaRow["kind"];
type Status = IdeaRow["status"];

const KINDS: { key: Kind; label: string; plural: string }[] = [
  { key: "story", label: "Story", plural: "Stories" },
  { key: "person", label: "Person", plural: "People" },
  { key: "battle", label: "Battle", plural: "Battles" },
];

const SECTIONS: { key: Status; title: string; hint: string }[] = [
  { key: "idea", title: "To do", hint: "Ideas waiting for their turn." },
  { key: "planned", title: "In progress", hint: "Being researched or written right now." },
  { key: "done", title: "Done", hint: "Published or finished." },
];

// One-click moves for each status, with the button wording.
const MOVES: Record<Status, { to: Status; label: string; primary?: boolean }[]> = {
  idea: [{ to: "planned", label: "Start working", primary: true }],
  planned: [
    { to: "done", label: "Mark done", primary: true },
    { to: "idea", label: "Back to to-do" },
  ],
  done: [{ to: "idea", label: "Reopen" }],
};

function isKind(value: string | undefined): value is Kind {
  return value === "story" || value === "person" || value === "battle";
}

function isUrl(line: string) {
  return /^https?:\/\/\S+$/i.test(line);
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function sourceLines(sources: string) {
  return sources
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function KindPicker({ name, current, idPrefix }: { name: string; current: Kind; idPrefix: string }) {
  return (
    <div className={styles.kindPicker} role="radiogroup" aria-label="What is this idea for?">
      {KINDS.map((kind) => (
        <label key={kind.key} className={`${styles.kindOption} ${styles[`kind_${kind.key}`]}`}>
          <input
            type="radio"
            name={name}
            value={kind.key}
            defaultChecked={kind.key === current}
            id={`${idPrefix}-${kind.key}`}
          />
          <span>{kind.label}</span>
        </label>
      ))}
    </div>
  );
}

function IdeaFields({ idea, idPrefix }: { idea?: IdeaRow; idPrefix: string }) {
  return (
    <>
      <div className={styles.field}>
        <span className={styles.label}>This is for a…</span>
        <KindPicker name="kind" current={idea?.kind ?? "story"} idPrefix={idPrefix} />
      </div>
      <div className={styles.field}>
        <label htmlFor={`${idPrefix}-title`}>Title</label>
        <input
          id={`${idPrefix}-title`}
          name="title"
          type="text"
          required
          defaultValue={idea?.title}
          placeholder="e.g. The siege of Krujë"
          autoComplete="off"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor={`${idPrefix}-notes`}>Description</label>
        <textarea
          id={`${idPrefix}-notes`}
          name="notes"
          rows={3}
          defaultValue={idea?.notes}
          placeholder="What is it about? Which angle do you want to take?"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor={`${idPrefix}-sources`}>
          Possible sources <span className={styles.optional}>one per line, links or book names</span>
        </label>
        <textarea
          id={`${idPrefix}-sources`}
          name="sources"
          rows={3}
          defaultValue={idea?.sources}
          placeholder={"https://…\nBarleti, De obsidione Scodrensi"}
        />
      </div>
    </>
  );
}

export default async function IdeasPage({ searchParams }: PageProps<"/kalaja-cabb0da6/ideas">) {
  await requireUser();

  const { kind: kindParam } = await searchParams;
  const rawKind = Array.isArray(kindParam) ? kindParam[0] : kindParam;
  const filter = isKind(rawKind) ? rawKind : null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `${error.message} — if this mentions a missing column, run supabase/ideas_v2.sql in the Supabase SQL editor.`
    );
  }
  const ideas = (data ?? []) as IdeaRow[];
  const visible = filter ? ideas.filter((idea) => idea.kind === filter) : ideas;
  const countFor = (kind: Kind) => ideas.filter((idea) => idea.kind === kind).length;

  return (
    <div className={styles.lab}>
      <div className={styles.inner}>
        <div className={styles.backRow}>
          <BackLink href="/kalaja-cabb0da6" label="Studio" />
        </div>

        <header className={styles.header}>
          <p className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden="true" />
            Idea Lab
          </p>
          <h1 className={styles.title}>What to publish next</h1>
          <p className={styles.lede}>
            Park ideas for stories, people and battles, with notes and sources, and move them along
            as you work. Only you can see this.
          </p>
        </header>

        <details className={styles.capture} open={ideas.length === 0}>
          <summary className={styles.captureSummary}>
            <span className={styles.plus} aria-hidden="true">
              +
            </span>
            New idea
          </summary>
          <form action={createIdea} className={styles.captureForm}>
            <IdeaFields idPrefix="new" />
            <div>
              <SubmitButton className={styles.primary} pendingText="Adding…">
                Add idea
              </SubmitButton>
            </div>
          </form>
        </details>

        <nav className={styles.filters} aria-label="Filter by type">
          <Link
            href="/kalaja-cabb0da6/ideas"
            className={`${styles.filter} ${!filter ? styles.filterActive : ""}`}
            aria-current={!filter ? "page" : undefined}
          >
            All <span>{ideas.length}</span>
          </Link>
          {KINDS.map((kind) => (
            <Link
              key={kind.key}
              href={`/kalaja-cabb0da6/ideas?kind=${kind.key}`}
              className={`${styles.filter} ${styles[`kind_${kind.key}`]} ${
                filter === kind.key ? styles.filterActive : ""
              }`}
              aria-current={filter === kind.key ? "page" : undefined}
            >
              {kind.plural} <span>{countFor(kind.key)}</span>
            </Link>
          ))}
        </nav>

        {ideas.length === 0 ? (
          <div className={styles.emptyLab}>
            <p className={styles.emptyTitle}>No ideas yet</p>
            <p className={styles.emptyText}>Add your first one above.</p>
          </div>
        ) : (
          SECTIONS.map((section) => {
            const items = visible.filter((idea) => idea.status === section.key);
            if (items.length === 0 && section.key === "done") return null;
            const body =
              items.length === 0 ? (
                <p className={styles.sectionEmpty}>{section.hint}</p>
              ) : (
                <div className={styles.cardGrid}>
                  {items.map((idea) => (
                    <IdeaCard key={idea.id} idea={idea} />
                  ))}
                </div>
              );

            return (
              <section key={section.key} className={styles.section}>
                {section.key === "done" ? (
                  <details className={styles.doneBox}>
                    <summary className={styles.sectionHead}>
                      <h2>{section.title}</h2>
                      <span className={styles.sectionCount}>{items.length}</span>
                      <span className={styles.sectionHint}>Show</span>
                    </summary>
                    {body}
                  </details>
                ) : (
                  <>
                    <div className={styles.sectionHead}>
                      <h2>{section.title}</h2>
                      <span className={styles.sectionCount}>{items.length}</span>
                      <span className={styles.sectionHint}>{section.hint}</span>
                    </div>
                    {body}
                  </>
                )}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}

function IdeaCard({ idea }: { idea: IdeaRow }) {
  const kind = KINDS.find((k) => k.key === idea.kind) ?? KINDS[0];
  const sources = sourceLines(idea.sources ?? "");

  return (
    <article className={`${styles.card} ${styles[`kind_${idea.kind}`]}`}>
      <span className={styles.kindBadge}>{kind.label}</span>
      <h3 className={styles.cardTitle}>{idea.title}</h3>
      {idea.notes && <p className={styles.cardNotes}>{idea.notes}</p>}

      {sources.length > 0 && (
        <div className={styles.sources}>
          <span className={styles.sourcesLabel}>Sources</span>
          <ul>
            {sources.map((line, index) => (
              <li key={index}>
                {isUrl(line) ? (
                  <a href={line} target="_blank" rel="noopener noreferrer">
                    {hostOf(line)}
                    <span aria-hidden="true"> ↗</span>
                  </a>
                ) : (
                  <span>{line}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.cardActions}>
        {MOVES[idea.status].map((move) => (
          <form key={move.to} action={updateIdeaStatus}>
            <input type="hidden" name="id" value={idea.id} />
            <input type="hidden" name="status" value={move.to} />
            <SubmitButton
              className={move.primary ? styles.moveButtonPrimary : styles.moveButton}
              pendingText="Moving…"
            >
              {move.label}
            </SubmitButton>
          </form>
        ))}
      </div>

      <div className={styles.tools}>
        <details className={styles.toolBox}>
          <summary>Edit</summary>
          <form action={updateIdea} className={styles.editForm}>
            <input type="hidden" name="id" value={idea.id} />
            <IdeaFields idea={idea} idPrefix={idea.id} />
            <SubmitButton className={styles.moveButtonPrimary} pendingText="Saving…">
              Save changes
            </SubmitButton>
          </form>
        </details>

        <details className={styles.toolBox}>
          <summary className={styles.dangerSummary}>Delete</summary>
          <form action={deleteIdea} className={styles.discardForm}>
            <input type="hidden" name="id" value={idea.id} />
            <span>Delete this idea for good?</span>
            <SubmitButton className={styles.dangerButton} pendingText="Deleting…">
              Yes, delete
            </SubmitButton>
          </form>
        </details>
      </div>
    </article>
  );
}
