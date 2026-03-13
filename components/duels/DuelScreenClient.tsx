'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Duel, DuelCooldown, DuelRound, Profile } from '@/backend/types'
import { createClient } from '@/frontend/lib/supabase/client'
import { triggerFloatingAP } from '@/frontend/components/ui/FloatingAP'
import { AftermathOverlay } from '@/components/duels/AftermathOverlay'
import { DuelGuide } from '@/components/duels/DuelGuide'
import { HPBar } from '@/components/duels/HPBar'
import { MoveButtons } from '@/components/duels/MoveButtons'
import { NarrativePanel } from '@/components/duels/NarrativePanel'
import { PreAssignmentMessage } from '@/components/duels/PreAssignmentMessage'
import { RoundHistory } from '@/components/duels/RoundHistory'
import { getDisplayRoundNarrative } from '@/lib/duels/presentation'

export function DuelScreenClient({
  initialDuel,
  initialRounds,
  viewer,
}: {
  initialDuel: Duel
  initialRounds: DuelRound[]
  viewer: Pick<Profile, 'id' | 'character_name'>
}) {
  const supabase = useMemo(() => createClient(), [])
  const [duel, setDuel] = useState(initialDuel)
  const [rounds, setRounds] = useState(initialRounds)
  const [cooldowns, setCooldowns] = useState<DuelCooldown[]>([])
  const [waiting, setWaiting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState('')
  const [aftermathDismissed, setAftermathDismissed] = useState(false)
  const [aftermathSummary, setAftermathSummary] = useState<string | null>(null)
  const [aftermathApLabel, setAftermathApLabel] = useState<string | null>(null)
  const lastApRef = useRef<HTMLDivElement | null>(null)

  const isChallenger = duel.challenger_id === viewer.id
  const ownCharacter = isChallenger ? duel.challenger_character : duel.defender_character
  const currentRound =
    rounds.find((round) => round.round_number === duel.current_round) ?? rounds[rounds.length - 1] ?? null
  const ownSubmitted = Boolean(
    isChallenger ? currentRound?.challenger_move_submitted_at : currentRound?.defender_move_submitted_at,
  )
  const previousRound =
    duel.current_round > 1 ? rounds.find((round) => round.round_number === duel.current_round - 1) ?? null : null
  const recoverLocked =
    (isChallenger ? previousRound?.challenger_move : previousRound?.defender_move) === 'recover'
  const specialLockedUntilRound =
    cooldowns.find((cooldown) => cooldown.user_id === viewer.id && cooldown.ability_type === 'special')
      ?.locked_until_round ?? null
  const latestResolvedRound = [...rounds].reverse().find((round) => round.resolved_at) ?? null
  const narrative = latestResolvedRound
    ? getDisplayRoundNarrative(
        latestResolvedRound,
        duel.challenger_character ?? 'Operative',
        duel.defender_character ?? 'Operative',
      )
    : 'The city observes.'
  const aftermathResult =
    duel.status === 'complete'
      ? duel.winner_id === viewer.id
        ? 'victory'
        : duel.winner_id === null
          ? 'draw'
          : 'defeat'
      : null
  const fallbackAftermathApLabel =
    aftermathResult === 'victory' ? '+50 AP' : aftermathResult === 'defeat' ? '-20 AP' : '+5 AP'
  const waitingLabel =
    duel.status === 'pending'
      ? 'Awaiting acceptance.'
      : ownSubmitted || waiting
        ? 'Move submitted. Awaiting opponent.'
        : 'Awaiting next move.'

  useEffect(() => {
    if (!currentRound?.round_deadline || !ownSubmitted) {
      setCountdown('')
      return
    }

    const tick = () => {
      const delta = new Date(currentRound.round_deadline ?? '').getTime() - Date.now()
      if (delta <= 0) {
        setCountdown('00:00')
        return
      }

      const minutes = Math.floor(delta / 60000)
      const seconds = Math.floor((delta % 60000) / 1000)
      setCountdown(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [currentRound?.round_deadline, ownSubmitted])

  useEffect(() => {
    if (duel.status !== 'active') {
      return
    }

    let active = true

    const loadLatest = async () => {
      const [duelResult, roundsResult, cooldownResult] = await Promise.all([
        supabase
          .from('duels')
          .select(
            'id, challenger_id, defender_id, challenger_character, defender_character, challenger_character_slug, defender_character_slug, challenger_faction, defender_faction, status, current_round, challenger_hp, defender_hp, challenger_max_hp, defender_max_hp, winner_id, loser_id, challenge_message, challenge_expires_at, accepted_at, completed_at, created_at',
          )
          .eq('id', duel.id)
          .maybeSingle(),
        supabase
          .from('duel_rounds')
          .select(
            'id, duel_id, round_number, challenger_move, challenger_override_character, challenger_move_submitted_at, defender_move, defender_move_submitted_at, round_started_at, round_deadline, reversal_available, reversal_deadline, reversal_used, challenger_damage_dealt, defender_damage_dealt, challenger_hp_after, defender_hp_after, special_events, narrative, narrative_is_fallback, resolved_at',
          )
          .eq('duel_id', duel.id)
          .order('round_number', { ascending: true })
          .limit(10),
        supabase
          .from('duel_cooldowns')
          .select('id, duel_id, user_id, ability_type, locked_until_round')
          .eq('duel_id', duel.id)
          .limit(20),
      ])

      if (!active) {
        return
      }

      if (duelResult.data) {
        setDuel(duelResult.data as Duel)
      }
      if (roundsResult.data) {
        setRounds((roundsResult.data as DuelRound[] | null) ?? [])
      }
      if (cooldownResult.data) {
        setCooldowns((cooldownResult.data as DuelCooldown[] | null) ?? [])
      }
      setWaiting(false)
    }

    void loadLatest()
    const timer = window.setInterval(() => {
      void loadLatest()
    }, 1000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [duel.id, duel.status, supabase])

  useEffect(() => {
    const duelChannel = supabase
      .channel(`duel:${duel.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'duels', filter: `id=eq.${duel.id}` },
        (payload) => {
          setDuel(payload.new as Duel)
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'duel_rounds', filter: `duel_id=eq.${duel.id}` },
        async () => {
          const [roundDataResult, cooldownDataResult] = await Promise.all([
            supabase
              .from('duel_rounds')
              .select(
                'id, duel_id, round_number, challenger_move, challenger_override_character, challenger_move_submitted_at, defender_move, defender_move_submitted_at, round_started_at, round_deadline, reversal_available, reversal_deadline, reversal_used, challenger_damage_dealt, defender_damage_dealt, challenger_hp_after, defender_hp_after, special_events, narrative, narrative_is_fallback, resolved_at',
              )
              .eq('duel_id', duel.id)
              .order('round_number', { ascending: true })
              .limit(10),
            supabase
              .from('duel_cooldowns')
              .select('id, duel_id, user_id, ability_type, locked_until_round')
              .eq('duel_id', duel.id)
              .limit(20),
          ])
          setRounds((roundDataResult.data as DuelRound[] | null) ?? [])
          setCooldowns((cooldownDataResult.data as DuelCooldown[] | null) ?? [])
          setWaiting(false)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(duelChannel)
    }
  }, [duel.id, supabase])

  useEffect(() => {
    if (!aftermathResult || !lastApRef.current || aftermathResult === 'defeat') {
      return
    }

    triggerFloatingAP(lastApRef.current, aftermathResult === 'draw' ? 5 : 50)
  }, [aftermathResult])

  useEffect(() => {
    setAftermathDismissed(false)
  }, [duel.id, duel.status])

  useEffect(() => {
    if (!aftermathResult) {
      setAftermathSummary(null)
      setAftermathApLabel(null)
      return
    }

    let active = true

    const loadAftermath = async () => {
      try {
        const response = await fetch(`/api/duels/${duel.id}/aftermath`, { cache: 'no-store' })
        const json = await response.json()
        if (!active || !response.ok) {
          return
        }
        setAftermathSummary(json.data?.summary ?? null)
        setAftermathApLabel(json.data?.apLabel ?? null)
      } catch {
        if (!active) {
          return
        }
        setAftermathSummary(null)
        setAftermathApLabel(null)
      }
    }

    void loadAftermath()
    return () => {
      active = false
    }
  }, [aftermathResult, duel.id])

  const submitMove = async (move: 'strike' | 'stance' | 'gambit' | 'special' | 'recover') => {
    setError(null)
    setWaiting(true)

    const response = await fetch('/api/duels/submit-move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duel_id: duel.id, move }),
    })
    const json = await response.json()

    if (!response.ok) {
      setError(json.error ?? 'Unable to submit move.')
      setWaiting(false)
      return
    }

    setWaiting(Boolean(json.waiting_for_opponent))
  }

  return (
    <>
      <PreAssignmentMessage userId={viewer.id} open={!viewer.character_name} />
      <div ref={lastApRef} style={{ display: 'grid', gap: '1.5rem' }}>
        <section className="paper-surface" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <div className="font-cinzel" style={{ fontSize: '1.3rem' }}>
              {duel.challenger_character ?? 'OPERATIVE'}
            </div>
            <div
              className="font-space-mono"
              style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text3)' }}
            >
              Round {Math.max(duel.current_round, 1)} / 5
            </div>
            <div className="font-cinzel" style={{ fontSize: '1.3rem', textAlign: 'right' }}>
              {duel.defender_character ?? 'OPERATIVE'}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <HPBar
              label="Challenger"
              value={duel.challenger_hp}
              max={duel.challenger_max_hp}
              align="left"
              showValue={isChallenger}
            />
            <div
              className="font-space-mono"
              style={{ color: 'var(--text3)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}
            >
              VS
            </div>
            <HPBar
              label="Defender"
              value={duel.defender_hp}
              max={duel.defender_max_hp}
              align="right"
              showValue={!isChallenger}
            />
          </div>

          <NarrativePanel narrative={narrative} />

          <DuelGuide
            variant="active"
            hasAssignedCharacter={Boolean(ownCharacter)}
            ownCharacterSlug={isChallenger ? duel.challenger_character_slug : duel.defender_character_slug}
            ownCharacterName={ownCharacter ?? 'Operative'}
            opponentCharacterSlug={isChallenger ? duel.defender_character_slug : duel.challenger_character_slug}
            opponentCharacterName={
              isChallenger ? duel.defender_character ?? 'Operative' : duel.challenger_character ?? 'Operative'
            }
          />

          {duel.status === 'pending' ? (
            <div className="paper-surface" style={{ padding: '1rem', textAlign: 'center' }}>
              <div className="font-cormorant" style={{ color: 'var(--text2)', fontStyle: 'italic' }}>
                This challenge is still awaiting the defender&apos;s response.
              </div>
            </div>
          ) : duel.status === 'active' && currentRound?.resolved_at === null && !ownSubmitted && !waiting ? (
            <MoveButtons
              disabled={false}
              canUseSpecial={Boolean(ownCharacter)}
              specialLabel={ownCharacter ? 'Special' : 'Ability Unregistered'}
              recoverLocked={recoverLocked}
              specialLockedUntilRound={specialLockedUntilRound}
              currentRound={Math.max(duel.current_round, 1)}
              onSubmit={submitMove}
            />
          ) : duel.status === 'active' ? (
            <div className="paper-surface" style={{ padding: '1rem', textAlign: 'center' }}>
              <div className="font-cormorant" style={{ color: 'var(--text2)', fontStyle: 'italic' }}>{waitingLabel}</div>
              {countdown ? (
                <div className="font-space-mono" style={{ marginTop: '0.45rem', color: 'var(--text3)', fontSize: '0.58rem' }}>
                  {countdown}
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <div className="font-cormorant" style={{ color: '#8B0000', fontStyle: 'italic' }}>
              {error}
            </div>
          ) : null}
        </section>

        <section className="paper-surface" style={{ padding: '1.5rem' }}>
          <div
            className="font-space-mono"
            style={{
              fontSize: '0.56rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--text3)',
              marginBottom: '1rem',
            }}
          >
            Round History
          </div>
          <RoundHistory
            rounds={rounds.filter((round) => round.resolved_at)}
            challengerName={duel.challenger_character ?? 'Operative'}
            defenderName={duel.defender_character ?? 'Operative'}
          />
        </section>
      </div>

      <AftermathOverlay
        open={Boolean(aftermathResult) && !aftermathDismissed}
        result={aftermathResult ?? 'draw'}
        apLabel={aftermathApLabel ?? fallbackAftermathApLabel}
        summary={
          aftermathSummary ??
          (aftermathResult === 'victory'
            ? 'The registry records your advantage as decisive.'
            : aftermathResult === 'defeat'
              ? "The registry closes this file in your opponent's favor."
              : 'The city records this confrontation as unresolved.')
        }
        onClose={() => setAftermathDismissed(true)}
      />
    </>
  )
}
