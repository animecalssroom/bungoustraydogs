'use client'

import { useEffect, useState } from 'react'
import type { Profile } from '@/backend/types'
import { createClient } from '@/frontend/lib/supabase/client'

export function useRealtimeProfile(
  userId: string | null | undefined,
  initialProfile: Profile | null = null,
) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile)

  useEffect(() => {
    setProfile((current) => {
      if (!userId) {
        return null
      }

      if (initialProfile?.id === userId) {
        return current ?? initialProfile
      }

      return current
    })
  }, [initialProfile, userId])

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      return
    }

    const supabase = createClient()
    let active = true

    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!active) return
      setProfile((data as Profile | null) ?? null)
    }

    void load()

    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          setProfile(payload.new as Profile)
        },
      )
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [userId])

  return profile
}
