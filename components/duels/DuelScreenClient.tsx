'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Duel, DuelCooldown, DuelRound, Profile } from '@/backend/types'
import { createClient } from '@/frontend/lib/supabase/client'
import { triggerFloatingAP } from '@/frontend/components/ui/FloatingAP'
import { AftermathOverlay } from '@/components/duels/AftermathOverlay'
import { DUEL_MAX_ROUNDS } from '@/lib/duels/shared'
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
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [aftermathDismissed, setAftermathDismissed] = useState(false)
  const [aftermathSummary, setAftermathSummary] = useState<string | null>(null)
  const [aftermathApLabel, setAftermathApLabel] = useState<string | null>(null)
  const [challengerDisplay, setChallengerDisplay] = useState<string | null>(null)
  const [defenderDisplay, setDefenderDisplay] = useState<string | null>(null)
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
    // compute display names for challenger/defender: prefer character name, fall back to username
    let active = true
    const loadDisplays = async () => {
      try {
        const missingChallenger = !duel.challenger_character
        const missingDefender = !duel.defender_character
        if (!missingChallenger && !missingDefender) {
          if (active) {
            setChallengerDisplay(duel.challenger_character ?? null)
            setDefenderDisplay(duel.defender_character ?? null)
          }
          return
        }

        const ids: string[] = []
        if (missingChallenger && duel.challenger_id) ids.push(duel.challenger_id)
        if (missingDefender && duel.defender_id) ids.push(duel.defender_id)

        if (ids.length === 0) {
          if (active) {
            setChallengerDisplay(duel.challenger_character ?? duel.challenger_faction ?? 'Unregistered')
            setDefenderDisplay(duel.defender_character ?? duel.defender_faction ?? 'Unregistered')
          }
          return
        }

        const { data, error } = await supabase.from('profiles').select('id, username, character_name').in('id', ids)
        if (error) {
          if (active) {
            setChallengerDisplay(duel.challenger_character ?? duel.challenger_faction ?? 'Unregistered')
            setDefenderDisplay(duel.defender_character ?? duel.defender_faction ?? 'Unregistered')
          }
          return
        }

        const map = new Map<string, { username: string; character_name: string | null }>()
        ;(data as any[] | null)?.forEach((r) => map.set(r.id, { username: r.username, character_name: r.character_name }))

        if (active) {
          setChallengerDisplay(
            duel.challenger_character ?? map.get(duel.challenger_id ?? '')?.character_name ?? map.get(duel.challenger_id ?? '')?.username ?? duel.challenger_faction ?? 'Unregistered',
          )
          setDefenderDisplay(
            duel.defender_character ?? map.get(duel.defender_id ?? '')?.character_name ?? map.get(duel.defender_id ?? '')?.username ?? duel.defender_faction ?? 'Unregistered',
          )
        }
      } catch {
        if (active) {
          setChallengerDisplay(duel.challenger_character ?? duel.challenger_faction ?? 'Unregistered')
          setDefenderDisplay(duel.defender_character ?? duel.defender_faction ?? 'Unregistered')
        }
      }
    }

    void loadDisplays()
    return () => {
      active = false
    }
  }, [duel.challenger_character, duel.defender_character, duel.challenger_id, duel.defender_id, duel.challenger_faction, duel.defender_faction, supabase])

  useEffect(() => {
    if (!currentRound?.round_deadline) {
      setCountdown('')
      setSecondsLeft(null)
      return
    }

    const target = new Date(currentRound.round_deadline ?? '').getTime()

    const tick = () => {
      const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000))
      setSecondsLeft(remaining)
      const minutes = Math.floor(remaining / 60)
      const seconds = remaining % 60
      setCountdown(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [currentRound?.round_deadline])

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
      if (json?.error === 'SUDDEN_DEATH_RESTRICTED') {
        setError('That move is locked during sudden-death rounds.')
      } else {
        setError(json.error ?? 'Unable to submit move.')
      }
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
              {challengerDisplay ?? duel.challenger_character ?? 'OPERATIVE'}
            </div>
            <div
              className="font-space-mono"
              style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text3)' }}
            >
              {`Round ${Math.max(duel.current_round, 1)} / ${DUEL_MAX_ROUNDS}`}
            </div>
            <div className="font-cinzel" style={{ fontSize: '1.3rem', textAlign: 'right' }}>
              {defenderDisplay ?? duel.defender_character ?? 'OPERATIVE'}
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
              isChallenger ? defenderDisplay ?? duel.defender_character ?? 'Operative' : challengerDisplay ?? duel.challenger_character ?? 'Operative'
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
                <div style={{ display: 'grid', gap: '0.35rem', marginTop: '0.45rem' }}>
                  {currentRound?.is_sudden_death ? (
                    <div className="font-cormorant" style={{ color: 'var(--accent)', fontSize: '0.7rem' }}>
                      SUDDEN DEATH — STANCE and RECOVER are locked. Only STRIKE, GAMBIT, or SPECIAL.
                    </div>
                  ) : (
                    <div className="font-space-mono" style={{ color: 'var(--text3)', fontSize: '0.58rem' }}>
                      {`Round ${Math.max(duel.current_round, 1)}`}
                    </div>
                  )}

                  <div className="font-space-mono" style={{ color: secondsLeft !== null && secondsLeft <= 30 ? 'var(--accent)' : 'var(--text3)', fontSize: '0.58rem' }}>
                    {secondsLeft === 0 ? 'AUTO-STANCE — awaiting resolution' : countdown}
                  </div>
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
            challengerName={challengerDisplay ?? duel.challenger_character ?? 'Operative'}
            defenderName={defenderDisplay ?? duel.defender_character ?? 'Operative'}
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
