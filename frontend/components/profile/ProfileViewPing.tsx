'use client'

import { useEffect } from 'react'

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

    if (window.localStorage.getItem(storageKey) === '1') {
      return
    }

    window.localStorage.setItem(storageKey, '1')

    void fetch('/api/behavior/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'profile_view',
        metadata: {
          username,
          date_key: dateKey,
        },
      }),
    }).catch(() => null)
  }, [isOwnProfile, username])

  return null
}
