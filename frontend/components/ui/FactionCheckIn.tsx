'use client'

import { useEffect } from 'react'
import type { FactionId } from '@/backend/types'
import { scheduleBehaviorPing } from '@/frontend/lib/behavior-ping'

interface FactionCheckInProps {
  factionId: FactionId
}

export function FactionCheckIn({ factionId }: FactionCheckInProps) {
  useEffect(() => {
    const dateKey = new Date().toISOString().slice(0, 10)
    const storageKey = `bsd_faction_checkin_${factionId}_${dateKey}`

    return scheduleBehaviorPing({
      storageKey,
      storageArea: 'local',
      delayMs: 12000,
      body: {
        eventType: 'faction_checkin',
        metadata: {
          faction: factionId,
          source: 'faction_room',
          date_key: dateKey,
        },
      },
    })
  }, [factionId])

  return null
}
