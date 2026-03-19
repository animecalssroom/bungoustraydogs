'use client'

import { useEffect } from 'react'
import type { FactionId } from '@/backend/types'
import { scheduleBehaviorPing } from '@/frontend/lib/behavior-ping'

export function FactionFeedPing({ factionId }: { factionId: FactionId }) {
  useEffect(() => {
    const dateKey = new Date().toISOString().slice(0, 10)

    return scheduleBehaviorPing({
      storageKey: `bsd_feed_view_${factionId}_${dateKey}`,
      storageArea: 'session',
      delayMs: 8000,
      body: {
        eventType: 'feed_view',
        metadata: {
          faction: factionId,
          source: 'faction_feed',
          date_key: dateKey,
        },
      },
    })
  }, [factionId])

  return null
}
