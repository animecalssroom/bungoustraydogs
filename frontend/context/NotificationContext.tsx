'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'
import type { Notification } from '@/backend/types'

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  pendingDuelChallenges: number
  loading: boolean
  markAsRead: (id: string) => Promise<boolean>
  markAllAsRead: () => Promise<void>
  refresh: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  pendingDuelChallenges: 0,
  loading: false,
  markAsRead: async () => false,
  markAllAsRead: async () => {},
  refresh: async () => {},
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    if (typeof document !== 'undefined' && document.hidden) return
    setLoading(true)
    try {
      const response = await fetch('/api/notifications?limit=20', {
        cache: 'no-store',
      })
      const json = await response.json().catch(() => ({}))
      if (response.ok && Array.isArray(json.data)) {
        setNotifications(json.data)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setNotifications([])
      return
    }

    void load()

    // Lightweight periodic refresh instead of always-on realtime channel
    const interval = window.setInterval(() => {
      void load()
    }, 60000)

    return () => {
      window.clearInterval(interval)
    }
  }, [user, load])

  const unreadCount = useMemo(() => 
    notifications.filter((item) => !item.read_at).length
  , [notifications])

  const pendingDuelChallenges = useMemo(() => 
    notifications.filter((item) => item.type === 'duel_challenge' && !item.read_at).length
  , [notifications])

  const markAsRead = useCallback(async (id: string) => {
    const now = new Date().toISOString()
    try {
      const response = await fetch('/api/notifications/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        setNotifications((current) =>
          current.map((item) => (item.id === id ? { ...item, read_at: now } : item)),
        )
        return true
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
    return false
  }, [])

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications
      .filter((item) => !item.read_at && item.type !== 'duel_challenge')
      .map((item) => item.id)

    if (unreadIds.length === 0) return

    await Promise.all(unreadIds.map((id) => markAsRead(id)))
  }, [notifications, markAsRead])

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    pendingDuelChallenges,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: load,
  }), [notifications, unreadCount, pendingDuelChallenges, loading, markAsRead, markAllAsRead, load])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
