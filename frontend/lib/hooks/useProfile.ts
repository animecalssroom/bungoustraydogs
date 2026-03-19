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

type StoredProfileCache = {
  userId: string
  profile: Profile | null
  savedAt: number
}

const PROFILE_STORAGE_KEY = 'bsd:profile-cache'
const PROFILE_STORAGE_TTL_MS = 60 * 1000

let cachedProfileUserId: string | null = null
let cachedProfile: Profile | null = null
let inFlightProfileRequest:
  | {
      userId: string
      promise: Promise<ProfileFetchResult>
    }
  | null = null

function readStoredProfile(userId: string): Profile | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(PROFILE_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as StoredProfileCache
    const isFresh =
      parsed.userId === userId &&
      Date.now() - parsed.savedAt < PROFILE_STORAGE_TTL_MS

    if (!isFresh) {
      window.sessionStorage.removeItem(PROFILE_STORAGE_KEY)
      return null
    }

    return parsed.profile
  } catch {
    return null
  }
}

function writeStoredProfile(userId: string, profile: Profile | null) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const payload: StoredProfileCache = {
      userId,
      profile,
      savedAt: Date.now(),
    }
    window.sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(payload))
  } catch {}
}

function clearStoredProfile() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.removeItem(PROFILE_STORAGE_KEY)
  } catch {}
}

async function fetchProfile(userId: string, force = false): Promise<ProfileFetchResult> {
  if (!force && cachedProfileUserId === userId) {
    return {
      profile: cachedProfile,
      error: null,
      unauthorized: false,
    }
  }

  if (!force) {
    const storedProfile = readStoredProfile(userId)
    if (storedProfile) {
      cachedProfileUserId = userId
      cachedProfile = storedProfile
      return {
        profile: storedProfile,
        error: null,
        unauthorized: false,
      }
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
        clearStoredProfile()
        return {
          profile: null,
          error: (json.error as string | null) ?? null,
          unauthorized: true,
        }
      }

      if (response.ok) {
        cachedProfileUserId = userId
        cachedProfile = nextProfile
        writeStoredProfile(userId, nextProfile)
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
        clearStoredProfile()
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
        if (result.error === 'No session') {
          console.warn('[useProfile] Definitive 401: No session found. Signing out.')
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
        } else {
          console.warn('[useProfile] Transient 401 or background error:', result.error)
          if (!active) return null
          setState((current) => ({
            ...current,
            loading: false,
            error: result.error,
          }))
        }
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && session?.user?.id === cachedProfileUserId) {
        setState((current) => ({
          ...current,
          user: session.user,
          loading: false,
          error: null,
          refresh,
        }))
        return
      }

      setState((current) => ({
        ...current,
        loading: true,
        error: null,
        refresh,
      }))

      void load(session?.user ?? null, event === 'USER_UPDATED')
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return state
}
