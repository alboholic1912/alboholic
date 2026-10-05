import Image from "next/image";
import Link from "next/link";
import type { Battle, BattlePerson } from "@/lib/content/public";
import { ArrowIcon, CalendarIcon, FlagIcon, PeopleIcon, PersonIcon, PinIcon, VersusIcon } from "./icons";
import { regionOf, yearLabel } from "./layout";
import styles from "./BattleCard.module.css";

interface BattleCardProps {
  battle: Battle;
  /** A couple of other battles from the same period, nearest in time first. */
  related: Battle[];
  onPick: (slug: string) => void;
  /** Opens the list of every battle from this one's period. */
  onSeeAll: () => void;
}

/**
 * Everything the map says about one battle, most important first: the top of it is what a
 * phone shows before the sheet is dragged up, so nothing below "Key People" is essential.
 */
export default function BattleCard({ battle, related, onPick, onSeeAll }: BattleCardProps) {
  return (
    <article className={styles.card}>
      {battle.image && (
        <div className={styles.hero}>
          <Image src={battle.image} alt="" fill sizes="(min-width: 960px) 384px, 70vw" quality={90} />
        </div>
      )}
      {battle.image && battle.aiImage && <span className={styles.aiTag}>AI-generated image</span>}

      <header className={styles.head}>
        <h2 className={styles.name}>{battle.name}</h2>
        <ul className={styles.meta}>
          {battle.date && (
            <li>
              <CalendarIcon size={17} />
              <span>{battle.date}</span>
            </li>
          )}
          {battle.location && (
            <li>
              <PinIcon size={17} />
              <span>{battle.location}</span>
            </li>
          )}
          {battle.participants && (
            <li>
              <VersusIcon size={17} />
              <span>{battle.participants}</span>
            </li>
          )}
        </ul>
      </header>

      {battle.summary && <p className={styles.summary}>{battle.summary}</p>}

      {battle.outcome && (
        <section className={styles.section}>
          <h3 className={`${styles.sectionTitle} ${styles.accent}`}>
            <FlagIcon />
            Outcome
          </h3>
          <p className={styles.outcome}>{battle.outcome}</p>
        </section>
      )}

      {battle.keyPeople.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <PeopleIcon />
            Key People
          </h3>
          <ul className={styles.people}>
            {battle.keyPeople.map((person) => (
              <li key={person.name}>
                <KeyPerson person={person} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {battle.story && (
        <Link href={`/stories/${battle.story.slug}`} className={styles.storyButton} aria-label={`View story: ${battle.story.title}`}>
          View Story
          <ArrowIcon />
        </Link>
      )}

      {battle.details.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>More Details</h3>
          <dl className={styles.details}>
            {battle.details.map((detail) => (
              <div key={`${detail.label}-${detail.value}`}>
                <dt>{detail.label}</dt>
                <dd>{detail.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {related.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionRow}>
            <h3 className={styles.sectionTitle}>Related Battles</h3>
            <button type="button" className={styles.seeAll} onClick={onSeeAll}>
              See all
              <ArrowIcon size={14} />
            </button>
          </div>
          <ul className={styles.related}>
            {related.map((other) => (
              <li key={other.slug}>
                <button type="button" onClick={() => onPick(other.slug)}>
                  {other.image && (
                    <span className={styles.relatedThumb}>
                      <Image src={other.image} alt="" fill sizes="72px" />
                    </span>
                  )}
                  <span className={styles.relatedText}>
                    <span className={styles.relatedName}>{other.name}</span>
                    <span className={styles.relatedMeta}>
                      {[yearLabel(other.year), regionOf(other.location)].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {battle.sources.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Sources</h3>
          <ul className={styles.sources}>
            {battle.sources.map((source) => (
              <li key={`${source.title}-${source.detail}`}>
                {source.url ? (
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                ) : (
                  <span>{source.title}</span>
                )}
                {source.detail && <span className={styles.sourceDetail}>{source.detail}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function KeyPerson({ person }: { person: BattlePerson }) {
  const content = (
    <>
      <span className={styles.portrait}>
        {person.image ? <Image src={person.image} alt="" fill sizes="(min-width: 960px) 170px, 72px" /> : <PersonIcon size={26} />}
      </span>
      <span className={styles.personText}>
        <span className={styles.personName}>{person.name}</span>
        {person.role && <span className={styles.personRole}>{person.role}</span>}
      </span>
    </>
  );

  // Only people with a published profile have somewhere to link to.
  return person.slug ? (
    <Link href={`/people/${person.slug}`} className={styles.person}>
      {content}
    </Link>
  ) : (
    <div className={styles.person}>{content}</div>
  );
}
