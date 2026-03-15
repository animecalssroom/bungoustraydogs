import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArchiveModel } from '@/backend/models/archive.model'
import { ArchiveBehaviorPing } from '@/frontend/components/archive/ArchiveBehaviorPing'
import { ArchiveVisitNote } from '@/frontend/components/archive/ArchiveVisitNote'
import styles from '@/frontend/components/archive/Archive.module.css'
import { getArchiveCaseNumber } from '@/frontend/lib/archive'
import { FACTION_META } from '@/frontend/lib/launch'
import { InkStamp } from '@/frontend/components/ui/InkStamp'
import { AbilityTypeIcon } from '@/frontend/components/character/AbilityTypeIcon'

const RESERVED_SLUGS = ['mori-ogai', 'fukuzawa-yukichi', 'fyodor-dostoyevsky', 'fitzgerald']

export const revalidate = 604800 // Weekly revalidation, but mostly static

export async function generateStaticParams() {
  const entries = await ArchiveModel.getAll()
  return entries.map((entry) => ({
    slug: entry.slug,
  }))
}

function renderTraitBar(label: string, value: number | null, isReserved: boolean) {
  const safeValue = value ?? 0

  return (
    <div key={label} className={styles.traitRow}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.barTrack}>
        <div 
          className={styles.barFill} 
          style={{ 
            width: isReserved ? '100%' : `${(safeValue / 5) * 100}%`,
            opacity: isReserved ? 0.3 : 1,
            background: isReserved ? 'var(--text4)' : 'var(--accent)'
          }} 
        />
      </div>
      <span className={styles.fieldLabel}>
        {isReserved ? '░░░' : `${safeValue}/5`}
      </span>
    </div>
  )
}

export default async function ArchiveEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = await ArchiveModel.getBySlug(slug)

  if (!entry) {
    notFound()
  }

  const factionMeta = FACTION_META[entry.faction]

  return (
    <div style={{ paddingTop: '36px' }}>
      <ArchiveBehaviorPing slug={entry.slug} />
      <div className={styles.caseWrap}>
        <Link href="/archive" className={styles.sidebarEyebrow}>
          Back to archive
        </Link>
        <article className={styles.caseFile}>
          <header className={styles.caseHeader}>
            <div>
              <p className={styles.caseMeta}>Case File</p>
              <h1 className={styles.caseNumber}>{getArchiveCaseNumber(entry.slug)}</h1>
            </div>
            <div className={styles.caseKanji}>{factionMeta.kanji}</div>
          </header>

          <section className={styles.designation}>
            <p className={styles.sectionLabel}>Designation</p>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={styles.designationName}>{entry.character_name}</h2>
                {entry.designation ? (
                  <p className={styles.designationSub}>{entry.designation}</p>
                ) : (
                  entry.character_name_jp ? (
                    <p className={styles.designationSub}>{entry.character_name_jp}</p>
                  ) : null
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {entry.clearance_level && (
                  <div className="ink-stamp" style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem', opacity: 0.8 }}>
                    {entry.clearance_level}
                  </div>
                )}
                {RESERVED_SLUGS.includes(entry.slug) && (
                  <div className="relative">
                    <InkStamp text="CLASSIFIED" color="var(--accent)" rotation={15} />
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className={styles.factsGrid}>
            <div>
              <p className={styles.fieldLabel}>Faction</p>
              <p className={styles.fieldValue}>{factionMeta.name}</p>
            </div>
            <div>
              <p className={styles.fieldLabel}>Ability Type</p>
              <div className="flex items-center gap-2">
                <p className={styles.fieldValue}>{entry.ability_type ?? 'classified'}</p>
                <AbilityTypeIcon type={entry.ability_type} size={14} />
              </div>
            </div>
            <div>
              <p className={styles.fieldLabel}>Status</p>
              <p className={styles.fieldValue}>{entry.status ?? 'active'}</p>
            </div>
          </section>

          <section className={styles.caseSection}>
            <p className={styles.sectionLabel}>Registered Ability</p>
            <p className={styles.designationSub}>
              {entry.ability_name}
              {entry.ability_name_jp ? ` · ${entry.ability_name_jp}` : ''}
            </p>
            <p className={styles.fieldValue}>{entry.ability_description}</p>
            {entry.ability_analysis && (
              <div className={styles.analyticalBreakdown}>
                <p className={styles.fieldLabel} style={{ fontSize: '0.65rem', marginBottom: '0.5rem' }}>Analytical Breakdown</p>
                <p className={styles.fieldValue}>{entry.ability_analysis}</p>
              </div>
            )}
          </section>

          <section className={styles.caseSection}>
            <p className={styles.sectionLabel}>Trait Assessment</p>
            <div className={styles.traitGrid}>
              {renderTraitBar('Power', entry.trait_power, RESERVED_SLUGS.includes(entry.slug))}
              {renderTraitBar('Intel', entry.trait_intel, RESERVED_SLUGS.includes(entry.slug))}
              {renderTraitBar('Loyalty', entry.trait_loyalty, RESERVED_SLUGS.includes(entry.slug))}
              {renderTraitBar('Control', entry.trait_control, RESERVED_SLUGS.includes(entry.slug))}
            </div>
          </section>

          {entry.special_mechanic && (
            <section className={styles.caseSection}>
              <p className={styles.sectionLabel}>SPECIAL Mechanic</p>
              <div className={styles.registryMark}>{entry.special_mechanic}</div>
            </section>
          )}

          {entry.duel_voice && (
            <section className={styles.caseSection}>
              <p className={styles.sectionLabel}>Duel Disposition</p>
              <p className={styles.fieldValue}>{entry.duel_voice}</p>
            </section>
          )}

          <section className={styles.caseSection}>
            <p className={styles.sectionLabel}>Literary Origin</p>
            <div className={styles.factsGrid}>
              <div>
                <p className={styles.fieldLabel}>Real Author</p>
                <p className={styles.fieldValue}>
                  {entry.real_author_name}
                  {entry.real_author_dates ? ` (${entry.real_author_dates})` : ''}
                </p>
              </div>
              <div>
                <p className={styles.fieldLabel}>Movement</p>
                <p className={styles.fieldValue}>{entry.literary_movement}</p>
              </div>
              <div>
                <p className={styles.fieldLabel}>Notable Works</p>
                <p className={styles.fieldValue}>
                  {entry.notable_works}
                  {entry.literary_link && (
                    <a href={entry.literary_link} target="_blank" rel="noopener noreferrer" className="ml-2 text-accent hover:underline">
                      [Full Text →]
                    </a>
                  )}
                </p>
              </div>
            </div>
            <p className={styles.fieldValue}>{entry.real_author_bio}</p>
            <p className={styles.fieldValue}>{entry.ability_literary_connection}</p>
          </section>

          {entry.lore_background && (
            <section className={styles.caseSection}>
              <p className={styles.sectionLabel}>Lore & Background</p>
              <p className={styles.fieldValue}>{entry.lore_background}</p>
            </section>
          )}

          {entry.physical_evidence && entry.physical_evidence.length > 0 && (
            <section className={styles.caseSection}>
              <p className={styles.sectionLabel}>Physical Evidence Scan</p>
              <ul className={styles.evidenceList}>
                {entry.physical_evidence.map((item, idx) => (
                  <li key={idx} className={styles.evidenceItem}>
                    <span className={styles.evidenceIndex}>[{String(idx + 1).padStart(2, '0')}]</span>
                    <p className={styles.fieldValue + " m-0"}>{item}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {entry.narrative_hook && (
            <section className={styles.narrativeHook}>
              <p className={styles.narrativeLabel}>The Narrative Hook</p>
              <p className={styles.narrativeText}>&ldquo;{entry.narrative_hook}&rdquo;</p>
            </section>
          )}

          <section className={styles.caseSection}>
            <p className={styles.sectionLabel}>Registry Note</p>
            <p className={styles.registryMark}>{entry.registry_note}</p>
            <ArchiveVisitNote slug={entry.slug} />
          </section>

          <p className={styles.filedBy}>Filed by: Special Division Registry</p>
        </article>
      </div>
    </div>
  )
}
