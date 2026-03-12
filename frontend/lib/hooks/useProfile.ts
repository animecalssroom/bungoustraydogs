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

type ProfileFetchResult = {
  profile: Profile | null
  error: string | null
  unauthorized: boolean
}

let cachedProfileUserId: string | null = null
let cachedProfile: Profile | null = null
let inFlightProfileRequest:
  | {
      userId: string
      promise: Promise<ProfileFetchResult>
    }
  | null = null

async function fetchProfile(userId: string, force = false): Promise<ProfileFetchResult> {
  if (!force && cachedProfileUserId === userId) {
    return {
      profile: cachedProfile,
      error: null,
      unauthorized: false,
    }
  }

  if (!force && inFlightProfileRequest?.userId === userId) {
    return inFlightProfileRequest.promise
  }

  const promise = fetch('/api/auth/me', { cache: 'no-store' })
    .then(async (response) => {
      const json = await response.json().catch(() => ({}))
      const nextProfile = (json.data as Profile | null) ?? null

      if (response.status === 401) {
        cachedProfileUserId = null
        cachedProfile = null
        return {
          profile: null,
          error: (json.error as string | null) ?? null,
          unauthorized: true,
        }
      }

      if (response.ok) {
        cachedProfileUserId = userId
        cachedProfile = nextProfile
      }

      return {
        profile: nextProfile,
        error: response.ok ? null : (json.error as string | null) ?? 'Failed to load profile',
        unauthorized: false,
      }
    })
    .finally(() => {
      if (inFlightProfileRequest?.userId === userId) {
        inFlightProfileRequest = null
      }
    })

  inFlightProfileRequest = { userId, promise }
  return promise
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

    const load = async (nextUser: User | null, force = false) => {
      if (!active) return null

      if (!nextUser) {
        cachedProfileUserId = null
        cachedProfile = null
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null,
          refresh,
        })
        return null
      }

      const result = await fetchProfile(nextUser.id, force)
      const nextProfile = result.profile

      if (result.unauthorized) {
        await supabase.auth.signOut()
        clearBrowserSupabaseSession()

        if (!active) return null

        setState({
          user: null,
          profile: null,
          loading: false,
          error: result.error,
          refresh,
        })

        return null
      }

      if (!active) return null

      setState({
        user: nextUser,
        profile: nextProfile,
        loading: false,
        error: result.error,
        refresh,
      })

      return nextProfile
    }

    refresh = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

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

      return load(session?.user ?? null, true)
    }

    setState((current) => ({
      ...current,
      refresh,
    }))

    void supabase.auth.getSession().then(({ data, error }) => {
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

      void load(data.session?.user ?? null)
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
