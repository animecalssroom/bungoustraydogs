'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Duel } from '@/backend/types'
import { formatRemainingTime } from '@/lib/duels/shared'
import { createClient } from '@/frontend/lib/supabase/client'

export function DuelInboxCard({
  duel,
  mode,
  onAction,
}: {
  duel: Duel
  mode: 'incoming' | 'outgoing'
  onAction: (kind: 'accept' | 'decline' | 'withdraw', duelId: string) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const [displayName, setDisplayName] = useState<string | null>(null)

  const run = async (kind: 'accept' | 'decline' | 'withdraw') => {
    setBusy(true)
    try {
      await onAction(kind, duel.id)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      const id = mode === 'incoming' ? duel.challenger_id : duel.defender_id
      const char = mode === 'incoming' ? duel.challenger_character : duel.defender_character
      if (char) {
        setDisplayName(char)
        return
      }
      if (!id) {
        setDisplayName('Unregistered Operative')
        return
      }

      try {
        const { data } = await supabase.from('profiles').select('username, character_name').eq('id', id).maybeSingle()
        if (!active) return
        setDisplayName(data?.character_name ?? data?.username ?? 'Unregistered Operative')
      } catch {
        if (!active) return
        setDisplayName('Unregistered Operative')
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [duel, mode, supabase])

  return (
    <article className="paper-surface" style={{ padding: '1rem', display: 'grid', gap: '0.7rem' }}>
      <div className="font-cinzel" style={{ fontSize: '1.15rem' }}>
        {mode === 'incoming'
          ? duel.challenger_character ?? 'Unregistered Operative'
          : duel.defender_character ?? 'Unregistered Operative'}
      </div>
      {duel.challenge_message ? (
        <p className="font-cormorant" style={{ margin: 0, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.6 }}>
          {duel.challenge_message}
        </p>
      ) : null}
      <div className="font-space-mono" style={{ fontSize: '0.58rem', color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {formatRemainingTime(duel.challenge_expires_at)}
      </div>
      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
        {mode === 'incoming' ? (
          <>
            <button type="button" className="btn-primary" disabled={busy} onClick={() => void run('accept')}>
              Accept Challenge
            </button>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => void run('decline')}>
              Decline
            </button>
          </>
        ) : (
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => void run('withdraw')}>
            Withdraw
          </button>
        )}
      </div>
    </article>
  )
}
