'use client'

import { createContext, useContext } from 'react'
import {
  clearBrowserSupabaseSession,
  createClient,
} from '@/frontend/lib/supabase/client'
import { useProfile } from '@/frontend/lib/hooks/useProfile'

interface AuthContextType {
  user: ReturnType<typeof useProfile>['user']
  profile: ReturnType<typeof useProfile>['profile']
  loading: boolean
  error: string | null
  refreshProfile: () => Promise<ReturnType<typeof useProfile>['profile']>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  refreshProfile: async () => null,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, error, refresh } = useProfile()

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearBrowserSupabaseSession()
    await fetch('/api/auth/signout', {
      method: 'POST',
      cache: 'no-store',
    }).catch(() => null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, error, refreshProfile: refresh, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
