'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/backend/types'
import {
  clearBrowserSupabaseSession,
  createClient,
} from '@/frontend/lib/supabase/client'

interface UseProfileState {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: string | null
  refresh: () => Promise<Profile | null>
}

export function useProfile(): UseProfileState {
  const [state, setState] = useState<UseProfileState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
    refresh: async () => null,
  })

  useEffect(() => {
    const supabase = createClient()
    let active = true
    let refresh: () => Promise<Profile | null> = async () => null

    const load = async (nextUser: User | null) => {
      if (!active) return null

      if (!nextUser) {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null,
          refresh,
        })
        return null
      }

      const response = await fetch('/api/auth/me', { cache: 'no-store' })
      const json = await response.json().catch(() => ({}))
      const nextProfile = (json.data as Profile | null) ?? null

      if (response.status === 401) {
        await supabase.auth.signOut()
        clearBrowserSupabaseSession()

        if (!active) return null

        setState({
          user: null,
          profile: null,
          loading: false,
          error: (json.error as string | null) ?? null,
          refresh,
        })

        return null
      }

      if (!active) return null

      setState({
        user: nextUser,
        profile: nextProfile,
        loading: false,
        error: response.ok ? null : (json.error as string | null) ?? 'Failed to load profile',
        refresh,
      })

      return nextProfile
    }

    refresh = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        if (active) {
          setState((current) => ({
            ...current,
            loading: false,
            error: error.message,
          }))
        }
        return null
      }

      return load(user)
    }

    setState((current) => ({
      ...current,
      refresh,
    }))

    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return

      if (error) {
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message,
          refresh,
        }))
        return
      }

      void load(data.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((current) => ({
        ...current,
        loading: true,
        error: null,
        refresh,
      }))

      void load(session?.user ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return state
}
