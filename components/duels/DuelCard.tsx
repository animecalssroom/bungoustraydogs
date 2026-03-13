'use client'

import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import type { Duel } from '@/backend/types'
import { formatRemainingTime, DUEL_MAX_ROUNDS } from '@/lib/duels/shared'
import { createClient } from '@/frontend/lib/supabase/client'

export function DuelCard({
  duel,
  userId,
}: {
  duel: Duel
  userId: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const isChallenger = duel.challenger_id === userId
  const [me, setMe] = useState<string>(
    isChallenger ? duel.challenger_character ?? duel.challenger_faction ?? 'Operative' : duel.defender_character ?? duel.defender_faction ?? 'Operative',
  )
  const [opponent, setOpponent] = useState<string>(
    isChallenger ? duel.defender_character ?? duel.defender_faction ?? 'Operative' : duel.challenger_character ?? duel.challenger_faction ?? 'Operative',
  )

  useEffect(() => {
    let active = true
    const load = async () => {
      const needMe = (isChallenger ? !duel.challenger_character : !duel.defender_character) && (isChallenger ? duel.challenger_id : duel.defender_id)
      const needOpp = (isChallenger ? !duel.defender_character : !duel.challenger_character) && (isChallenger ? duel.defender_id : duel.challenger_id)
      const ids: string[] = []
      if (needMe) ids.push(isChallenger ? duel.challenger_id! : duel.defender_id!)
      if (needOpp) ids.push(isChallenger ? duel.defender_id! : duel.challenger_id!)

      if (ids.length === 0) {
        setMe(isChallenger ? duel.challenger_character ?? duel.challenger_faction ?? 'Operative' : duel.defender_character ?? duel.defender_faction ?? 'Operative')
        setOpponent(isChallenger ? duel.defender_character ?? duel.defender_faction ?? 'Operative' : duel.challenger_character ?? duel.challenger_faction ?? 'Operative')
        return
      }

      try {
        const { data } = await supabase.from('profiles').select('id, username, character_name').in('id', ids)
        const map = new Map<string, any>()
        ;(data as any[] | null)?.forEach((r) => map.set(r.id, r))

        if (!active) return

        const meName = isChallenger
          ? duel.challenger_character ?? map.get(duel.challenger_id ?? '')?.character_name ?? map.get(duel.challenger_id ?? '')?.username ?? duel.challenger_faction ?? 'Operative'
          : duel.defender_character ?? map.get(duel.defender_id ?? '')?.character_name ?? map.get(duel.defender_id ?? '')?.username ?? duel.defender_faction ?? 'Operative'
        const oppName = isChallenger
          ? duel.defender_character ?? map.get(duel.defender_id ?? '')?.character_name ?? map.get(duel.defender_id ?? '')?.username ?? duel.defender_faction ?? 'Operative'
          : duel.challenger_character ?? map.get(duel.challenger_id ?? '')?.character_name ?? map.get(duel.challenger_id ?? '')?.username ?? duel.challenger_faction ?? 'Operative'

        setMe(meName)
        setOpponent(oppName)
      } catch {
        if (!active) return
        setMe(isChallenger ? duel.challenger_character ?? duel.challenger_faction ?? 'Operative' : duel.defender_character ?? duel.defender_faction ?? 'Operative')
        setOpponent(isChallenger ? duel.defender_character ?? duel.defender_faction ?? 'Operative' : duel.challenger_character ?? duel.challenger_faction ?? 'Operative')
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [duel, isChallenger, supabase])

  return (
    <article
      className="paper-surface"
      style={{ padding: '1rem', display: 'grid', gap: '0.65rem' }}
    >
      <div className="font-cinzel" style={{ fontSize: '1.15rem' }}>
        {me} vs {opponent}
      </div>
      <div className="font-space-mono" style={{ fontSize: '0.58rem', color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {duel.status === 'pending'
          ? `Pending - ${formatRemainingTime(duel.challenge_expires_at)}`
          : `Round ${Math.max(duel.current_round, 1)} / ${DUEL_MAX_ROUNDS}`}
      </div>
      <Link href={duel.status === 'pending' ? '/duels/inbox' : `/duels/${duel.id}`} className="btn-secondary">
        {duel.status === 'pending' ? 'Respond In Inbox' : 'Enter Duel'}
      </Link>
    </article>
  )
}
