'use client'

import { useEffect } from 'react'
import { scheduleBehaviorPing } from '@/frontend/lib/behavior-ping'

export function ProfileViewPing({
  username,
  isOwnProfile,
}: {
  username: string
  isOwnProfile: boolean
}) {
  useEffect(() => {
    if (isOwnProfile) {
      return
    }

    const dateKey = new Date().toISOString().slice(0, 10)
    const storageKey = `bsd_profile_view_${username}_${dateKey}`

    return scheduleBehaviorPing({
      storageKey,
      storageArea: 'local',
      delayMs: 7000,
      body: {
        eventType: 'profile_view',
        metadata: {
          username,
          date_key: dateKey,
        },
      },
    })
  }, [isOwnProfile, username])

  return null
}
