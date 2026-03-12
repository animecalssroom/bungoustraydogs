'use client'

import { useEffect } from 'react'
import type { FactionId } from '@/backend/types'

interface FactionCheckInProps {
  factionId: FactionId
}

export function FactionCheckIn({ factionId }: FactionCheckInProps) {
  useEffect(() => {
    const dateKey = new Date().toISOString().slice(0, 10)
    const storageKey = `bsd_faction_checkin_${factionId}_${dateKey}`

    if (window.localStorage.getItem(storageKey) === '1') {
      return
    }

    window.localStorage.setItem(storageKey, '1')

    void fetch('/api/behavior/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'faction_checkin',
        metadata: {
          faction: factionId,
          source: 'faction_room',
          date_key: dateKey,
        },
      }),
    }).catch(() => null)
  }, [factionId])

  return null
}
