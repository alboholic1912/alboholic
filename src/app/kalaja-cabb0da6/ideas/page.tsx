import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import type { IdeaRow } from "@/lib/content/types";
import BackLink from "@/components/BackLink/BackLink";
import { createIdea, updateIdeaStatus, deleteIdea } from "./actions";
import styles from "../studio.module.css";

export const metadata: Metadata = {
  title: "Ideas — Studio",
  robots: { index: false, follow: false },
};

const STATUSES: IdeaRow["status"][] = ["idea", "planned", "archived"];

export default async function IdeasPage() {
  await requireUser();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  const ideas = (data ?? []) as IdeaRow[];

  return (
    <div className={styles.wrap}>
      <div className={styles.backRow}>
        <BackLink href="/kalaja-cabb0da6" label="Studio" />
      </div>

      <h1 className={styles.title} style={{ marginBottom: "var(--space-6)" }}>
        Ideas &amp; future plans
      </h1>

      <form action={createIdea} className={styles.form} style={{ marginBottom: "var(--space-8)" }}>
        <div className={styles.field}>
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" required />
        </div>
        <div className={styles.field}>
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" rows={4} />
        </div>
        <div className={styles.actions}>
          <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`}>
            Add idea
          </button>
        </div>
      </form>

      {ideas.length === 0 ? (
        <p className={styles.empty}>No ideas yet — add the first one above.</p>
      ) : (
        <div className={styles.list}>
          {ideas.map((idea) => (
            <div key={idea.id} className={styles.ideaCard}>
              <div className={styles.ideaBody}>
                <div className={styles.listRowTitle}>{idea.title}</div>
                {idea.notes && <div className={styles.ideaNotes}>{idea.notes}</div>}
              </div>
              <div className={styles.ideaControls}>
                <form action={updateIdeaStatus} className={styles.ideaControls}>
                  <input type="hidden" name="id" value={idea.id} />
                  <select name="status" defaultValue={idea.status}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className={styles.button}>
                    Update
                  </button>
                </form>
                <form action={deleteIdea}>
                  <input type="hidden" name="id" value={idea.id} />
                  <button type="submit" className={`${styles.button} ${styles.buttonDanger}`}>
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
