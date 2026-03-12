'use client'

import { useEffect } from 'react'

interface ArchiveBehaviorPingProps {
  slug: string
}

export function ArchiveBehaviorPing({ slug }: ArchiveBehaviorPingProps) {
  useEffect(() => {
    const dateKey = new Date().toISOString().slice(0, 10)
    const storageKey = `bsd_archive_read_${dateKey}`
    const raw = window.localStorage.getItem(storageKey)
    const state = raw
      ? (JSON.parse(raw) as { total: number; slugs: Record<string, number> })
      : { total: 0, slugs: {} as Record<string, number> }

    if (state.total >= 5) {
      return
    }

    state.total += 1
    state.slugs[slug] = (state.slugs[slug] ?? 0) + 1
    window.localStorage.setItem(storageKey, JSON.stringify(state))

    void fetch('/api/behavior/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'archive_read',
        metadata: {
          slug,
          read_count: state.slugs[slug],
          day_total: state.total,
          date_key: dateKey,
        },
      }),
    }).catch(() => null)
  }, [slug])

  return null
}
