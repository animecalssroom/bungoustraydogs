'use client'

import { useEffect } from 'react'
import type { FactionId } from '@/backend/types'

export function FactionFeedPing({ factionId }: { factionId: FactionId }) {
  useEffect(() => {
    const storageKey = `bsd_feed_view_${factionId}`

    if (window.sessionStorage.getItem(storageKey) === '1') {
      return
    }

    window.sessionStorage.setItem(storageKey, '1')

    void fetch('/api/behavior/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'feed_view',
        metadata: {
          faction: factionId,
          source: 'faction_feed',
        },
      }),
    }).catch(() => null)
  }, [factionId])

  return null
}
