'use client'

import { useEffect } from 'react'
import { scheduleBehaviorPing } from '@/frontend/lib/behavior-ping'

interface ArchiveBehaviorPingProps {
  slug: string
}

export function ArchiveBehaviorPing({ slug }: ArchiveBehaviorPingProps) {
  useEffect(() => {
    const dateKey = new Date().toISOString().slice(0, 10)
    const storageKey = `bsd_archive_read_${slug}_${dateKey}`
    const dayKey = `bsd_archive_read_day_${dateKey}`
    const raw = window.localStorage.getItem(dayKey)
    const state = raw
      ? (JSON.parse(raw) as { total: number; slugs: Record<string, number> })
      : { total: 0, slugs: {} as Record<string, number> }

    if (window.localStorage.getItem(storageKey) === '1' || state.total >= 3) {
      return
    }

    state.total += 1
    state.slugs[slug] = (state.slugs[slug] ?? 0) + 1
    window.localStorage.setItem(dayKey, JSON.stringify(state))

    return scheduleBehaviorPing({
      storageKey,
      storageArea: 'local',
      delayMs: 10000,
      body: {
        eventType: 'archive_read',
        metadata: {
          slug,
          read_count: state.slugs[slug],
          day_total: state.total,
          date_key: dateKey,
        },
      },
    })
  }, [slug])

  return null
}
