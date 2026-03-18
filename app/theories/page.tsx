'use client'

import { useMemo, useState } from 'react'
import type { TheoryCategory } from '@/backend/types'
import { FAN_THEORIES_CATALOG } from '@/backend/lib/fan-theories-catalog'
import styles from './theories.module.css'

const CATEGORY_LABELS: Record<TheoryCategory | 'all', string> = {
  all: 'All',
  plot_theory: 'Plot Theory',
  character_study: 'Character Study',
  ability_analysis: 'Ability Analysis',
  arc_review: 'Arc Review',
}

const CATEGORY_FILTERS: Array<'all' | TheoryCategory> = [
  'all',
  'plot_theory',
  'character_study',
  'ability_analysis',
  'arc_review',
]

export default function TheoriesPage() {
  const [category, setCategory] = useState<'all' | TheoryCategory>('all')

  const filtered = useMemo(() => {
    if (category === 'all') return FAN_THEORIES_CATALOG
    return FAN_THEORIES_CATALOG.filter((t) => t.category === category)
  }, [category])

  return (
    <div style={{ paddingTop: '36px' }}>
      <div className="section-head">
        <p className="section-eyebrow">Community · Fan Theories</p>
        <h1 className="section-title">
          The <em>Theory Desk</em>
        </h1>
        <div className="ink-divider" />
        <p className="section-sub">
          Curated fan theories from the community—speculation, analysis, and the arguments
          Yokohama's archivists keep coming back to.
        </p>
      </div>

      <div className={styles.theoriesShell}>
        <div className={styles.filterRow}>
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`${styles.filterChip} ${category === filter ? styles.filterChipActive : ''}`}
              onClick={() => setCategory(filter)}
            >
              {CATEGORY_LABELS[filter]}
            </button>
          ))}
        </div>

        <div className={styles.theoryGrid}>
          {filtered.length === 0 && (
            <p className={styles.emptyState}>No theories filed under this category yet.</p>
          )}

          {filtered.map((theory) => (
            <article
              key={theory.id}
              className={`${styles.theoryCard} ${theory.featured ? styles.theoryCardFeatured : ''}`}
            >
              <div className={styles.theoryHeader}>
                <h2 className={styles.theoryTitle}>{theory.title}</h2>
                <span className={styles.categoryBadge} data-category={theory.category}>
                  {CATEGORY_LABELS[theory.category]}
                </span>
              </div>

              <p className={styles.theoryAuthor}>
                Theorized by {theory.author_name}
              </p>

              <p className={styles.theorySummary}>{theory.summary}</p>

              <div className={styles.theoryFooter}>
                <a
                  href={theory.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.theorySource}
                >
                  View Source →
                </a>
                {theory.featured && <span className={styles.featuredTag}>Featured</span>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
