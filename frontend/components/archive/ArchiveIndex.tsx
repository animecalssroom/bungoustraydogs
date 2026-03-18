'use client'

import { useDeferredValue, useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import type { AbilityType, ArchiveEntry } from '@/backend/types'
import {
  ARCHIVE_FACTION_FILTERS,
  type ArchiveFactionFilter,
  getArchiveCaseNumber,
  getArchiveFactionColor,
  getArchiveFactionDisplay,
  getArchiveFactionLabel,
  matchesArchiveFactionFilter,
} from '@/frontend/lib/archive'
import { RESERVED_SLUGS } from '@/frontend/lib/home-content'
import { AbilityTypeIcon } from '@/frontend/components/character/AbilityTypeIcon'
import styles from './Archive.module.css'

const ABILITY_FILTERS: Array<'all' | AbilityType> = [
  'all',
  'destruction',
  'counter',
  'manipulation',
  'analysis',
]

interface ArchiveIndexProps {
  entries: ArchiveEntry[]
}

export function ArchiveIndex({ entries }: ArchiveIndexProps) {
  const [search, setSearch] = useState('')
  const [factionFilter, setFactionFilter] = useState<ArchiveFactionFilter>('all')
  const [abilityFilter, setAbilityFilter] = useState<'all' | AbilityType>('all')
  const deferredSearch = useDeferredValue(search)

  const counts = useMemo(() => {
    return ARCHIVE_FACTION_FILTERS.reduce<Record<ArchiveFactionFilter, number>>((acc, filter) => {
      acc[filter] = entries.filter((entry) => matchesArchiveFactionFilter(entry, filter)).length
      return acc
    }, {} as Record<ArchiveFactionFilter, number>)
  }, [entries])

  const filteredEntries = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()

    return entries.filter((entry) => {
      const matchesSearch =
        !query ||
        entry.character_name.toLowerCase().includes(query) ||
        entry.ability_name.toLowerCase().includes(query) ||
        entry.real_author_name?.toLowerCase().includes(query) ||
        entry.notable_works?.toLowerCase().includes(query)

      const matchesFaction = matchesArchiveFactionFilter(entry, factionFilter)
      const matchesAbility =
        abilityFilter === 'all' ? true : entry.ability_type === abilityFilter

      return matchesSearch && matchesFaction && matchesAbility
    })
  }, [abilityFilter, deferredSearch, entries, factionFilter])

  return (
    <div className={styles.archiveShell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBlock}>
          <p className={styles.sidebarEyebrow}>Archive</p>
          <h2 className={styles.sidebarTitle}>Public Character Files</h2>
        </div>

        <div className={styles.sidebarBlock}>
          <p className={styles.sidebarLabel}>Categories</p>
          <div className={styles.filterStack}>
            {ARCHIVE_FACTION_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`${styles.filterButton} ${
                  factionFilter === filter ? styles.filterButtonActive : ''
                }`}
                onClick={() => setFactionFilter(filter)}
              >
                <span>{getArchiveFactionLabel(filter)}</span>
                <span>{counts[filter]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.sidebarBlock}>
          <p className={styles.sidebarLabel}>Ability Type</p>
          <div className={styles.filterStack}>
            {ABILITY_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`${styles.filterButton} ${
                  abilityFilter === filter ? styles.filterButtonActive : ''
                }`}
                onClick={() => setAbilityFilter(filter)}
              >
                <span>{filter === 'all' ? 'All' : filter}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className={styles.mainPane}>
        <div className={styles.searchRow}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={styles.searchInput}
            type="search"
            placeholder="Search character, ability, or author"
          />
          <span className={styles.searchMeta}>{filteredEntries.length} files</span>
        </div>

        <div className={styles.cardGrid}>
          {filteredEntries.map((entry) => (
            <Link
              key={entry.slug}
              href={`/archive/${entry.slug}`}
              className={styles.card}
              style={{ '--archive-accent': getArchiveFactionColor(entry.faction) } as CSSProperties}
            >
              <div className={styles.cardMeta}>
                <span>{getArchiveCaseNumber(entry.slug)}</span>
                <span className={styles.cardMetaSep}>·</span>
                <span>{getArchiveFactionDisplay(entry)}</span>
              </div>
              <h3 className={styles.cardTitle}>{entry.character_name}</h3>
              <p className={styles.cardAbility}>{entry.ability_name}</p>
              <div className={styles.cardRow}>
                <div className="flex items-center gap-1.5">
                  <span className={styles.cardBadge} data-type={entry.ability_type}>
                    {entry.ability_type ?? 'classified'}
                  </span>
                  <AbilityTypeIcon type={entry.ability_type ?? 'classified' as any} size={11} />
                </div>
                <div className={styles.cardAuthorBlock}>
                  <p className={styles.cardAuthor}>
                    {entry.real_author_name} {entry.real_author_dates ? `(${entry.real_author_dates})` : ''}
                  </p>
                  {entry.notable_works && (
                    <p className={styles.cardNotableWorks}>Ref: {entry.notable_works.split(',')[0]}</p>
                  )}
                </div>
              </div>

              <div className={styles.cardStats}>
                {[
                  { label: 'P', value: entry.trait_power },
                  { label: 'I', value: entry.trait_intel },
                  { label: 'L', value: entry.trait_loyalty },
                  { label: 'C', value: entry.trait_control },
                ].map((stat) => (
                  <div key={stat.label} className={styles.statMini}>
                    <span className={styles.statLabel}>{stat.label}</span>
                    <div className={styles.statTrack}>
                      <div 
                        className={styles.statFill} 
                        style={{ 
                          width: RESERVED_SLUGS.includes(entry.slug) ? '100%' : `${((stat.value ?? 0) / 5) * 100}%`,
                          opacity: RESERVED_SLUGS.includes(entry.slug) ? 0.3 : 1
                        }} 
                      />
                    </div>
                    {RESERVED_SLUGS.includes(entry.slug) && (
                      <span className={styles.statRedacted}>░</span>
                    )}
                  </div>
                ))}
              </div>

              <p className={styles.cardTeaser}>
                {entry.ability_description?.split('. ')[0] ?? 'File retained in public circulation.'}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
