'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LorePost, RegistryPost, ChronicleEntry, Profile, FanTheory } from '@/backend/types'
import { LorePageGridWithInitialPosts } from '@/frontend/components/lore/LoreCard'
import { RegistryFeed } from '@/frontend/components/registry/RegistryFeed'
import { ErrorBoundary } from '@/frontend/components/ui/ErrorBoundary'
import styles from './RecordsHub.module.css'

interface RecordsPageClientProps {
  initialTab: string
  lorePosts: LorePost[]
  registryPosts: RegistryPost[]
  chronicleEntries: ChronicleEntry[]
  fanTheories: FanTheory[]
  profile: Profile | null
}

type RecordTab = 'lore' | 'field-notes' | 'chronicle'

export default function RecordsPageClient({
  initialTab,
  lorePosts,
  registryPosts,
  chronicleEntries,
  fanTheories,
  profile
}: RecordsPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<RecordTab>((searchParams.get('tab') as RecordTab) || (initialTab as RecordTab) || 'lore')
  const [showHelper, setShowHelper] = useState(false)

  useEffect(() => {
    const tab = searchParams.get('tab') as RecordTab
    if (tab && ['lore', 'field-notes', 'chronicle'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    const hasSeenHelper = sessionStorage.getItem('bsd_records_helper_seen')
    if (!hasSeenHelper) {
      setShowHelper(true)
    }
  }, [])

  const handleTabChange = (tab: RecordTab) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`/records?${params.toString()}`, { scroll: false })
  }

  const dismissHelper = () => {
    setShowHelper(false)
    sessionStorage.setItem('bsd_records_helper_seen', 'true')
  }

  const renderTheoryCard = (theory: FanTheory) => (
    <article key={theory.id} className={styles.theoryCard}>
      <div className={styles.theoryHeader}>
        <span className={styles.theoryCategory}>{theory.category.replace('_', ' ')}</span>
        {theory.featured ? <span className={styles.theoryFeatured}>Featured</span> : null}
      </div>
      <h3 className={styles.theoryTitle}>{theory.title}</h3>
      <p className={styles.theorySummary}>{theory.summary}</p>
      <div className={styles.theoryMeta}>
        <span>{theory.author_name}</span>
        <a href={theory.source_url} target="_blank" rel="noopener noreferrer" className={styles.theoryLink}>
          Source
        </a>
      </div>
    </article>
  )

  const renderLore = () => (
    <div className={styles.tabContent}>
      <section className={styles.theorySection}>
        <div className={styles.theorySectionHead}>
          <p className="section-eyebrow">Curated Fan Theories</p>
          <p className="section-sub">
            Community-sourced plot theories, character studies, and ability analysis gathered into the Lore desk.
          </p>
        </div>
        <div className={styles.theoryGrid}>
          {fanTheories.map((theory) => renderTheoryCard(theory))}
        </div>
      </section>

      {lorePosts.length > 0 ? (
        <LorePageGridWithInitialPosts posts={lorePosts} />
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyText}>
            No essays filed in the Hall yet.<br/>
            The literary desk is silent.
          </div>
          <Link href="/records/lore/submit" className="btn-primary">Write Lore</Link>
        </div>
      )}

      {profile && (
        <Link href="/records/lore/submit" className={styles.fab} title="Write Lore">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </Link>
      )}
    </div>
  )

  const renderFieldNotes = () => (
    <div className={styles.tabContent}>
      {registryPosts.length > 0 ? (
        <RegistryFeed initialPosts={registryPosts} />
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyText}>
            No incident reports logged for this period.<br/>
            Yokohama remains stable—for now.
          </div>
          {profile && profile.rank >= 2 ? (
            <Link href="/records/field-notes/submit" className="btn-primary">File a Report</Link>
          ) : (
            <div className={styles.emptyText} style={{ opacity: 0.6, fontSize: '0.9rem' }}>Rank 2 required to file field notes.</div>
          )}
        </div>
      )}
      {profile && profile.rank >= 2 && (
        <Link href="/records/field-notes/submit" className={styles.fab} title="File Report">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
        </Link>
      )}
    </div>
  )

  const renderChronicle = () => (
    <div className={styles.tabContent}>
      <div className="section-wrap">
        {chronicleEntries.length > 0 ? (
          <div className={styles.chronicleList}>
            {chronicleEntries.map(entry => (
              <Link 
                href={`/records/chronicle/${entry.id}`} 
                key={entry.id} 
                className={styles.chronicleEntry}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div className={styles.entryHeader}>
                  <div className={styles.entryMeta}>
                    <span className={styles.entryNumber}>#{String(entry.entry_number).padStart(3, '0')}</span>
                    <span className={`${styles.entryType} ${styles[`entryType_${entry.entry_type}`]}`}>
                      {entry.entry_type.replace('_', ' ')}
                    </span>
                  </div>
                  {entry.published_at && (
                    <span className={styles.entryNumber}>{new Date(entry.published_at).toLocaleDateString()}</span>
                  )}
                </div>
                <h3 className={styles.entryTitle}>{entry.title}</h3>
                <p className={styles.entryContent}>{entry.content}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyText}>
              The city has not yet published its official record.<br/>
              The first war remains in progress.
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <ErrorBoundary>
      <div className={styles.wrap}>
        <div className="section-head">
          <p className="section-eyebrow">Records Hall · Yokohama Collective</p>
          <h1 className="section-title">
            The <em>Records Hall</em>
          </h1>
          <div className="ink-divider" />
        </div>

        {activeTab === 'lore' && (
          <div className={styles.helperBox}>
            <button onClick={() => setShowHelper(!showHelper)} className={styles.helperClose} style={{ fontSize: '0.6rem' }}>{showHelper ? 'COLLAPSE' : 'INFO'}</button>
            {showHelper && (
              <>
                <p className="section-eyebrow">USE LORE FOR</p>
                <p className="section-sub">Literary studies of Bungou Stray Dogs, fan theories, character essays, and deep-dives into Yokohama mythology. Open to all members.</p>
              </>
            )}
          </div>
        )}
        {activeTab === 'field-notes' && (
          <div className={styles.helperBox}>
            <button onClick={() => setShowHelper(!showHelper)} className={styles.helperClose} style={{ fontSize: '0.6rem' }}>{showHelper ? 'COLLAPSE' : 'INFO'}</button>
            {showHelper && (
              <>
                <p className="section-eyebrow">USE FIELD NOTES FOR</p>
                <p className="section-sub">In-world field reports, mission logs, and operational observations written from your character&apos;s perspective. Requires Rank 2 (Senior Operative).</p>
              </>
            )}
          </div>
        )}
        {activeTab === 'chronicle' && (
          <div className={styles.helperBox}>
            <p className="section-eyebrow">WHAT IS THE CHRONICLE?</p>
            <p className="section-sub">The Chronicle is the official city record of wars, major faction shifts, and historical milestones. It is updated by Ango Sakaguchi&apos;s office. Read-only.</p>
          </div>
        )}

        <div className={styles.tabBar}>
          <button 
            className={`${styles.tab} ${activeTab === 'lore' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('lore')}
          >
            Lore
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'field-notes' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('field-notes')}
          >
            Field Notes
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'chronicle' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('chronicle')}
          >
            Chronicle
          </button>
        </div>

        {activeTab === 'lore' && renderLore()}
        {activeTab === 'field-notes' && renderFieldNotes()}
        {activeTab === 'chronicle' && renderChronicle()}
      </div>
    </ErrorBoundary>
  )
}
