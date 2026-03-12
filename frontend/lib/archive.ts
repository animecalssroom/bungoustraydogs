import type { ArchiveEntry, FactionId } from '@/backend/types'
import { FACTION_META } from '@/frontend/lib/launch'

export const ARCHIVE_FACTION_FILTERS = [
  'all',
  'agency',
  'mafia',
  'guild',
  'hunting_dogs',
  'special_div',
  'unaffiliated',
] as const

export type ArchiveFactionFilter = (typeof ARCHIVE_FACTION_FILTERS)[number]

export function getArchiveCaseNumber(slug: string) {
  let hash = 0

  for (let index = 0; index < slug.length; index += 1) {
    hash = (hash * 33 + slug.charCodeAt(index)) >>> 0
  }

  return `SDR-${String(1000 + (hash % 9000)).padStart(4, '0')}`
}

export function getArchiveFactionLabel(filter: ArchiveFactionFilter) {
  if (filter === 'all') return 'All Entries'
  if (filter === 'unaffiliated') return 'Unaffiliated'
  return FACTION_META[filter].name
}

export function getArchiveFactionColor(faction: FactionId) {
  return FACTION_META[faction]?.color ?? '#8b6020'
}

export function getArchiveFactionDisplay(entry: ArchiveEntry) {
  if (entry.faction === 'rats' || entry.faction === 'decay' || entry.faction === 'clock_tower') {
    return 'Unaffiliated'
  }

  return FACTION_META[entry.faction]?.name ?? 'Unaffiliated'
}

export function matchesArchiveFactionFilter(
  entry: ArchiveEntry,
  filter: ArchiveFactionFilter,
) {
  if (filter === 'all') return true
  if (filter === 'unaffiliated') {
    return entry.faction === 'rats' || entry.faction === 'decay' || entry.faction === 'clock_tower'
  }

  return entry.faction === filter
}
