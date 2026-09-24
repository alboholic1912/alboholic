import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/dal";
import { getContentById } from "@/lib/content/data";
import { updateContent, publishContent, unpublishContent, deleteContent } from "@/lib/content/actions";
import { CONTENT_CONFIG, type FieldDef } from "@/lib/content/config";
import { isContentType, type SourceRecord } from "@/lib/content/types";
import BackLink from "@/components/BackLink/BackLink";
import styles from "../../studio.module.css";

const TYPES_WITH_IMAGE = new Set(["stories", "people", "places"]);

export async function generateMetadata({
  params,
}: PageProps<"/kalaja-cabb0da6/[type]/[id]">): Promise<Metadata> {
  const { type } = await params;
  const config = isContentType(type) ? CONTENT_CONFIG[type] : null;
  return {
    title: config ? `Edit ${config.label} — Studio` : "Studio",
    robots: { index: false, follow: false },
  };
}

export default async function EditContentPage({
  params,
}: PageProps<"/kalaja-cabb0da6/[type]/[id]">) {
  await requireUser();

  const { type, id } = await params;
  if (!isContentType(type)) notFound();
  const config = CONTENT_CONFIG[type];

  const item = await getContentById(type, id);
  if (!item) notFound();

  const record = item as unknown as Record<string, unknown>;
  const sources = (record.sources as SourceRecord[] | undefined) ?? [];
  const hasImage = TYPES_WITH_IMAGE.has(type);

  return (
    <div className={styles.wrap}>
      <div className={styles.backRow}>
        <BackLink href={`/kalaja-cabb0da6/${type}`} label={config.labelPlural} />
      </div>

      <div className={styles.toolbar}>
        <h1 className={styles.title}>{String(record[config.titleField] ?? "Untitled")}</h1>
        <span
          className={`${styles.badge} ${
            record.status === "published" ? styles.badgePublished : styles.badgeReview
          }`}
        >
          {String(record.status)}
        </span>
      </div>

      {sources.length > 0 && (
        <div className={styles.section} style={{ marginBottom: "var(--space-6)" }}>
          <div className={styles.sectionTitle}>Sources used to generate this</div>
          <ul style={{ paddingLeft: "1.2em", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            {sources.map((source, i) => (
              <li key={i}>
                {source.kind === "text" && <>Pasted text — &ldquo;{source.preview}&rdquo;&hellip;</>}
                {source.kind === "youtube" && <>YouTube — {source.url}</>}
                {source.kind === "file" && <>File — {source.name}</>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={updateContent} className={styles.form}>
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="id" value={id} />

        {hasImage && (
          <div className={styles.field}>
            <label htmlFor="image">Featured image</label>
            {typeof record.image === "string" && record.image ? (
              <Image src={record.image} alt="" width={280} height={180} className={styles.thumb} unoptimized />
            ) : (
              <p className={styles.help}>No image uploaded yet.</p>
            )}
            <input id="image" type="file" name="image" accept="image/*" />
            <span className={styles.help}>
              Choose a file, then click &ldquo;Save changes&rdquo; below to upload it.
            </span>
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="slug">Slug</label>
          <input id="slug" name="slug" type="text" defaultValue={item.slug} />
        </div>

        {config.fields.map((field) => renderField(field, record))}

        <div className={styles.actions}>
          <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`}>
            Save changes
          </button>
        </div>
      </form>

      <div className={styles.actions} style={{ marginTop: "var(--space-6)" }}>
        {record.status === "published" ? (
          <form action={unpublishContent}>
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="id" value={id} />
            <button type="submit" className={styles.button}>
              Unpublish
            </button>
          </form>
        ) : (
          <form action={publishContent}>
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="id" value={id} />
            <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`}>
              Publish to site
            </button>
          </form>
        )}
        <form action={deleteContent}>
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="id" value={id} />
          <button type="submit" className={`${styles.button} ${styles.buttonDanger}`}>
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}

function renderField(field: FieldDef, record: Record<string, unknown>) {
  const value = record[field.key];

  if (field.kind === "checkbox") {
    return (
      <div key={field.key} className={`${styles.field} ${styles.checkboxField}`}>
        <input id={field.key} name={field.key} type="checkbox" defaultChecked={Boolean(value)} />
        <label htmlFor={field.key}>{field.label}</label>
      </div>
    );
  }

  if (field.kind === "select") {
    return (
      <div key={field.key} className={styles.field}>
        <label htmlFor={field.key}>{field.label}</label>
        <select id={field.key} name={field.key} defaultValue={String(value ?? "")}>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.kind === "paragraphs") {
    const text = Array.isArray(value) ? value.join("\n") : "";
    return (
      <div key={field.key} className={styles.field}>
        <label htmlFor={field.key}>{field.label}</label>
        <textarea id={field.key} name={field.key} rows={12} defaultValue={text} />
        {field.helpText && <span className={styles.help}>{field.helpText}</span>}
      </div>
    );
  }

  if (field.kind === "textarea") {
    return (
      <div key={field.key} className={styles.field}>
        <label htmlFor={field.key}>{field.label}</label>
        <textarea id={field.key} name={field.key} rows={4} defaultValue={String(value ?? "")} />
        {field.helpText && <span className={styles.help}>{field.helpText}</span>}
      </div>
    );
  }

  if (field.kind === "number") {
    return (
      <div key={field.key} className={styles.field}>
        <label htmlFor={field.key}>{field.label}</label>
        <input id={field.key} name={field.key} type="number" defaultValue={Number(value ?? 0)} />
      </div>
    );
  }

  return (
    <div key={field.key} className={styles.field}>
      <label htmlFor={field.key}>{field.label}</label>
      <input id={field.key} name={field.key} type="text" defaultValue={String(value ?? "")} />
      {field.helpText && <span className={styles.help}>{field.helpText}</span>}
    </div>
  );
}
