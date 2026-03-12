import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArchiveModel } from '@/backend/models/archive.model'
import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'
import { ArchiveBehaviorPing } from '@/frontend/components/archive/ArchiveBehaviorPing'
import { ArchiveVisitNote } from '@/frontend/components/archive/ArchiveVisitNote'
import styles from '@/frontend/components/archive/Archive.module.css'
import { getArchiveCaseNumber } from '@/frontend/lib/archive'
import { FACTION_META } from '@/frontend/lib/launch'

export const revalidate = 300

function renderTraitBar(label: string, value: number | null) {
  const safeValue = value ?? 0

  return (
    <div key={label} className={styles.traitRow}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${(safeValue / 5) * 100}%` }} />
      </div>
      <span className={styles.fieldLabel}>{safeValue}/5</span>
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
    <>
      <Nav />
      <main style={{ paddingTop: '96px' }}>
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
              <h2 className={styles.designationName}>{entry.character_name}</h2>
              {entry.character_name_jp ? (
                <p className={styles.designationSub}>{entry.character_name_jp}</p>
              ) : null}
            </section>

            <section className={styles.factsGrid}>
              <div>
                <p className={styles.fieldLabel}>Faction</p>
                <p className={styles.fieldValue}>{factionMeta.name}</p>
              </div>
              <div>
                <p className={styles.fieldLabel}>Ability Type</p>
                <p className={styles.fieldValue}>{entry.ability_type ?? 'classified'}</p>
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
            </section>

            <section className={styles.caseSection}>
              <p className={styles.sectionLabel}>Trait Assessment</p>
              <div className={styles.traitGrid}>
                {renderTraitBar('Power', entry.trait_power)}
                {renderTraitBar('Intel', entry.trait_intel)}
                {renderTraitBar('Loyalty', entry.trait_loyalty)}
                {renderTraitBar('Control', entry.trait_control)}
              </div>
            </section>

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
                  <p className={styles.fieldValue}>{entry.notable_works}</p>
                </div>
              </div>
              <p className={styles.fieldValue}>{entry.real_author_bio}</p>
              <p className={styles.fieldValue}>{entry.ability_literary_connection}</p>
            </section>

            <section className={styles.caseSection}>
              <p className={styles.sectionLabel}>Registry Note</p>
              <p className={styles.registryMark}>{entry.registry_note}</p>
              <ArchiveVisitNote slug={entry.slug} />
            </section>

            <p className={styles.filedBy}>Filed by: Special Division Registry</p>
          </article>
        </div>
      </main>
      <Footer />
    </>
  )
}
