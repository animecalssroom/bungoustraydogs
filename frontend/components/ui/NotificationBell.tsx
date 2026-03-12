'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/frontend/lib/supabase/client'
import type { Notification } from '@/backend/types'

export default function NotificationBell({ userId }: { userId: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    let active = true

    const load = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!active) {
        return
      }

      setNotifications((data as Notification[] | null) ?? [])
    }

    void load()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((current) => [payload.new as Notification, ...current].slice(0, 10))
        },
      )
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  const unreadCount = notifications.filter((item) => !item.read_at).length
  const unreadSpecialInvite = notifications.find(
    (item) => item.type === 'special_division_invite' && !item.read_at,
  )
  const specialInvitePath =
    typeof unreadSpecialInvite?.payload?.redirect_to === 'string'
      ? unreadSpecialInvite.payload.redirect_to
      : '/faction/special_div'

  const markSingleRead = async (notificationId: string) => {
    const now = new Date().toISOString()
    const response = await fetch(`/api/notifications/${notificationId}/acknowledge`, {
      method: 'POST',
    })

    if (!response.ok) {
      return
    }

    setNotifications((current) =>
      current.map((item) => (item.id === notificationId ? { ...item, read_at: now } : item)),
    )
  }

  useEffect(() => {
    if (!unreadSpecialInvite) {
      return
    }

    if (pathname !== specialInvitePath && pathname !== '/faction/special_div' && pathname !== '/faction/special') {
      return
    }

    void markSingleRead(unreadSpecialInvite.id)
  }, [pathname, specialInvitePath, unreadSpecialInvite])

  const markRead = async () => {
    const unreadIds = notifications.filter((item) => !item.read_at).map((item) => item.id)

    if (unreadIds.length === 0) {
      return
    }

    await Promise.all(unreadIds.map((notificationId) => markSingleRead(notificationId)))
  }

  const toggle = () => {
    const next = !open
    setOpen(next)

    if (next && unreadCount > 0) {
      void markRead()
    }
  }

  const isSpecialInvite = (item: Notification) => item.type === 'special_division_invite'

  const openDraftNotice = async () => {
    if (unreadSpecialInvite) {
      await markSingleRead(unreadSpecialInvite.id)
    }

    setOpen(true)
  }

  const reportToRegistry = async () => {
    if (unreadSpecialInvite) {
      await markSingleRead(unreadSpecialInvite.id)
    }

    setOpen(false)
    router.push(specialInvitePath)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={toggle}
        className="font-space-mono"
        style={{
          border: '1px solid var(--border)',
          background: 'color-mix(in srgb, var(--surface) 52%, transparent)',
          color: unreadCount > 0 ? 'var(--accent)' : 'var(--text2)',
          minHeight: '36px',
          padding: '0 0.75rem',
          cursor: 'pointer',
          fontSize: '0.58rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        {unreadCount > 0 ? `◉ ${unreadCount}` : '○'}
      </button>

      <AnimatePresence>
        {unreadSpecialInvite && !open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              right: 0,
              width: '320px',
              maxWidth: 'calc(100vw - 2rem)',
              border: '1px solid #3f0f12',
              background: 'color-mix(in srgb, var(--card) 86%, #120708)',
              boxShadow: '0 18px 36px rgba(0, 0, 0, 0.18)',
              zIndex: 699,
              padding: '0.9rem 1rem',
            }}
          >
            <div
              className="font-space-mono"
              style={{
                fontSize: '0.52rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#8B0000',
              }}
            >
              Special Division Draft
            </div>
            <div
              className="font-cormorant"
              style={{
                marginTop: '0.45rem',
                fontSize: '1.02rem',
                lineHeight: 1.5,
                color: 'var(--text2)',
                fontStyle: 'italic',
              }}
            >
              {unreadSpecialInvite.message}
            </div>
            <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => void reportToRegistry()}
                className="font-space-mono"
                style={{
                  border: 0,
                  background: 'transparent',
                  fontSize: '0.52rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#8B0000',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Report To Registry
              </button>
              <button
                type="button"
                onClick={() => void openDraftNotice()}
                className="font-space-mono"
                style={{
                  border: 0,
                  background: 'transparent',
                  color: 'var(--text3)',
                  cursor: 'pointer',
                  fontSize: '0.52rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                Open Notice
              </button>
            </div>
          </motion.div>
        ) : null}

        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              right: 0,
              width: '320px',
              maxWidth: 'calc(100vw - 2rem)',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              boxShadow: '0 18px 36px rgba(0, 0, 0, 0.14)',
              zIndex: 700,
            }}
          >
            <div
              className="font-space-mono"
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border2)',
                fontSize: '0.55rem',
                letterSpacing: '0.2em',
                color: 'var(--text2)',
              }}
            >
              City Transmissions
            </div>
            {notifications.length === 0 ? (
              <div
                className="font-cormorant"
                style={{
                  padding: '1rem',
                  color: 'var(--text3)',
                  fontSize: '1rem',
                  fontStyle: 'italic',
                }}
              >
                No transmissions received.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderBottom: '1px solid var(--border2)',
                    background: item.read_at ? 'transparent' : 'var(--tag)',
                  }}
                >
                  <div
                    className="font-cormorant"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.55rem',
                      fontSize: isSpecialInvite(item) ? '1.05rem' : '0.95rem',
                      color: 'var(--text2)',
                      lineHeight: 1.5,
                      fontStyle: isSpecialInvite(item) ? 'italic' : 'normal',
                    }}
                  >
                    {isSpecialInvite(item) ? (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '999px',
                          background: '#8B0000',
                          marginTop: '0.45rem',
                          flex: '0 0 auto',
                        }}
                      />
                    ) : null}
                    <span>{item.message}</span>
                  </div>
                  <div
                    className="font-space-mono"
                    style={{
                      marginTop: '0.35rem',
                      fontSize: '0.52rem',
                      letterSpacing: '0.08em',
                      color: 'var(--text3)',
                    }}
                  >
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
