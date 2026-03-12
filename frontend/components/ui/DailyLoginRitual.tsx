'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '@/frontend/context/AuthContext'

function getTokyoDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value ?? '0000'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'

  return `${year}-${month}-${day}`
}

function formatJapaneseDate(date = new Date()) {
  return new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
    timeZone: 'Asia/Tokyo',
    era: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export default function DailyLoginRitual() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const attemptedRef = useRef<string | null>(null)
  const [ritual, setRitual] = useState<{
    streak: number
    awardedAp: number
    bonusAwarded: number
  } | null>(null)

  useEffect(() => {
    if (loading || !user || !profile) {
      return
    }

    const todayKey = getTokyoDateKey()
    const storageKey = `bsd_daily_login:${user.id}`

    if (attemptedRef.current === todayKey) {
      return
    }

    attemptedRef.current = todayKey

    if (window.localStorage.getItem(storageKey) === todayKey) {
      return
    }

    let active = true

    const claim = async () => {
      const response = await fetch('/api/behavior/daily-login', {
        method: 'POST',
      })
      const json = await response.json().catch(() => ({}))
      const data = json.data as
        | {
            alreadyClaimed: boolean
            streak: number
            awardedAp: number
            bonusAwarded: number
          }
        | undefined

      if (!active || !data) {
        return
      }

      window.localStorage.setItem(storageKey, todayKey)

      if (data.alreadyClaimed || data.awardedAp <= 0) {
        return
      }

      setRitual({
        streak: data.streak,
        awardedAp: data.awardedAp,
        bonusAwarded: data.bonusAwarded,
      })

      void refreshProfile()

      window.setTimeout(() => {
        if (active) {
          setRitual(null)
        }
      }, 2500)
    }

    void claim()

    return () => {
      active = false
    }
  }, [loading, profile, refreshProfile, user])

  return (
    <AnimatePresence>
      {ritual ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9992,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(6, 4, 8, 0.72)',
            padding: '24px',
          }}
        >
          <div
            className="paper-surface"
            style={{
              width: 'min(520px, 100%)',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <div
              className="font-space-mono"
              style={{
                fontSize: '0.58rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
              }}
            >
              {formatJapaneseDate()}
            </div>
            <h2
              className="font-cinzel"
              style={{
                marginTop: '0.9rem',
                fontSize: 'clamp(1.5rem, 4vw, 2.4rem)',
                lineHeight: 1.1,
              }}
            >
              Yokohama Acknowledges Your Return
            </h2>
            <p
              className="font-cormorant"
              style={{
                marginTop: '0.8rem',
                fontSize: '1.15rem',
                color: 'var(--text2)',
                fontStyle: 'italic',
              }}
            >
              Day {ritual.streak} on record. +{ritual.awardedAp} AP
              {ritual.bonusAwarded > 0 ? ' including a streak bonus.' : '.'}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
