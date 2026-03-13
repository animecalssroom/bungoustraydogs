'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/frontend/context/AuthContext'
import { useRealtimeProfile } from '@/frontend/lib/hooks/useRealtimeProfile'

const REVEAL_KEY = 'bsd_char_reveal_shown'

export function CharacterAssignmentRedirect() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile } = useAuth()
  const liveProfile = useRealtimeProfile(user?.id, profile)
  const activeProfile = liveProfile ?? profile

  useEffect(() => {
    if (!activeProfile?.username || !activeProfile.character_match_id) {
      return
    }

    const profilePath = `/profile/${activeProfile.username}`

    if (pathname === profilePath) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    if (window.localStorage.getItem(REVEAL_KEY) === activeProfile.character_match_id) {
      return
    }

    try {
      window.localStorage.setItem(REVEAL_KEY, activeProfile.character_match_id)
    } catch (e) {
      // ignore localStorage errors
    }

    router.push(profilePath)
  }, [activeProfile?.character_match_id, activeProfile?.username, pathname, router])

  return null
}
