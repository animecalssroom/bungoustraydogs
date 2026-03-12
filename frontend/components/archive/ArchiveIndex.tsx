'use client'

import { useMemo, useState, type CSSProperties } from 'react'
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

  const counts = useMemo(() => {
    return ARCHIVE_FACTION_FILTERS.reduce<Record<ArchiveFactionFilter, number>>((acc, filter) => {
      acc[filter] = entries.filter((entry) => matchesArchiveFactionFilter(entry, filter)).length
      return acc
    }, {} as Record<ArchiveFactionFilter, number>)
  }, [entries])

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase()

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
  }, [abilityFilter, entries, factionFilter, search])

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
                <span>{getArchiveFactionDisplay(entry)}</span>
              </div>
              <h3 className={styles.cardTitle}>{entry.character_name}</h3>
              <p className={styles.cardAbility}>{entry.ability_name}</p>
              <div className={styles.cardRow}>
                <span className={styles.cardBadge}>{entry.ability_type ?? 'classified'}</span>
                <span className={styles.cardAuthor}>{entry.real_author_name}</span>
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
