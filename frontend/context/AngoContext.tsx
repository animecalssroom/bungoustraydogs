'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/frontend/context/AuthContext'

type AngoContextValue = {
  isAngo: boolean
  invite: (userId: string, username: string) => Promise<boolean>
  recentlyInvited: Set<string>
}

const AngoContext = createContext<AngoContextValue>({
  isAngo: false,
  invite: async () => false,
  recentlyInvited: new Set<string>(),
})

export function AngoProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [recentlyInvited, setRecentlyInvited] = useState<Set<string>>(new Set())

  const isAngo = profile?.role === 'mod' && profile.faction === 'special_div'

  const invite = useCallback(
    async (userId: string, username: string) => {
      if (!isAngo) {
        return false
      }

      const response = await fetch('/api/special/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_user_id: userId,
          target_username: username,
        }),
      })

      if (!response.ok) {
        return false
      }

      setRecentlyInvited((current) => {
        const next = new Set(current)
        next.add(userId)
        return next
      })

      return true
    },
    [isAngo],
  )

  const value = useMemo(
    () => ({
      isAngo,
      invite,
      recentlyInvited,
    }),
    [invite, isAngo, recentlyInvited],
  )

  return <AngoContext.Provider value={value}>{children}</AngoContext.Provider>
}

export function useAngo() {
  return useContext(AngoContext)
}
