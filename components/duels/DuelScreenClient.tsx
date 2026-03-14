'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Duel, DuelCooldown, DuelMove, DuelRound, FactionId, Profile } from '@/backend/types/index'
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
import type { MoveConstraints } from '@/app/duels/[duelId]/page'

// ── Faction tokens ────────────────────────────────────────────────────────
const FACTION_COLOR: Record<string, string> = {
  agency: 'var(--color-agency, #8B6020)',
  mafia: 'var(--color-mafia, #CC1A1A)',
  guild: 'var(--color-guild, #C8A020)',
  hunting_dogs: 'var(--color-dogs, #4A6A8A)',
  special_div: 'var(--color-special, #4A5A6A)',
  rats: '#5a3a5a',
  decay: '#3a4a3a',
  clock_tower: '#4a4a5a',
}

const FACTION_KANJI: Record<string, string> = {
  agency: '探',
  mafia: '黒',
  guild: '金',
  hunting_dogs: '猟',
  special_div: '特',
  rats: '鼠',
  decay: '堕',
  clock_tower: '鐘',
}

function factionColor(f: FactionId | null | undefined) {
  return f ? (FACTION_COLOR[f] ?? 'var(--accent)') : 'var(--accent)'
}

function factionKanji(f: FactionId | null | undefined, characterName: string | null | undefined) {
  if (f && FACTION_KANJI[f]) return FACTION_KANJI[f]
  if (characterName) return characterName.charAt(0).toUpperCase()
  return '?'
}

// ── Canon rivalries ────────────────────────────────────────────────────────
const CANON_RIVALRIES = [
  {
    slugA: 'nakajima-atsushi',
    slugB: 'akutagawa-ryunosuke',
    label: '虎 vs 羅生門 — Shin Soukoku',
    effect: '+10 damage dealt to each other every round.',
  },
  {
    slugA: 'dazai-osamu',
    slugB: 'nakahara-chuuya',
    label: '双黒 — Double Black',
    effect: '+5 damage both sides. Dazai nullify drops to 80% vs Chuuya.',
  },
  {
    slugA: 'dazai-osamu',
    slugB: 'akutagawa-ryunosuke',
    label: '師弟 — Master and Student',
    effect: 'Dazai nullifies Akutagawa 100%. Akutagawa deals +5 rage damage.',
  },
  {
    slugA: 'sakunosuke-oda',
    slugB: 'akutagawa-ryunosuke',
    label: '鎮魂 — Requiem',
    effect: 'Oda deals +8 damage to Akutagawa every round.',
  },
]

function getRivalry(slugA?: string | null, slugB?: string | null) {
  if (!slugA || !slugB) return null
  return (
    CANON_RIVALRIES.find(
      (r) =>
        (r.slugA === slugA && r.slugB === slugB) ||
        (r.slugA === slugB && r.slugB === slugA),
    ) ?? null
  )
}

// ── Timer bar ─────────────────────────────────────────────────────────────
function TimerBar({
  secondsLeft,
  totalSeconds,
}: {
  secondsLeft: number
  totalSeconds: number
}) {
  const pct = Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100))
  const urgent = secondsLeft <= 60
  return (
    <div style={{ height: '2px', background: 'var(--border2)', borderRadius: '1px', overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: urgent ? 'var(--color-mafia, #CC1A1A)' : 'var(--text3)',
          transition: 'width 1s linear, background 0.4s',
          borderRadius: '1px',
        }}
      />
    </div>
  )
}

// ── Fighter portrait ───────────────────────────────────────────────────────
function FighterPortrait({
  faction,
  characterName,
  align,
}: {
  faction: FactionId | null | undefined
  characterName: string | null | undefined
  align: 'left' | 'right'
}) {
  const color = factionColor(faction)
  const kanji = factionKanji(faction, characterName)

  const clipLeft = 'polygon(12% 0%, 100% 0%, 100% 88%, 88% 100%, 0% 100%, 0% 12%)'
  const clipRight = 'polygon(0% 0%, 88% 0%, 100% 12%, 100% 100%, 12% 100%, 0% 88%)'

  return (
    <div
      style={{
        width: '72px',
        height: '90px',
        flexShrink: 0,
        position: 'relative',
        clipPath: align === 'left' ? clipLeft : clipRight,
        background: `color-mix(in srgb, ${color} 10%, var(--surface, transparent))`,
        border: `1.5px solid color-mix(in srgb, ${color} 40%, transparent)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        className="font-cinzel"
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          color,
          opacity: 0.55,
          userSelect: 'none',
        }}
      >
        {kanji}
      </span>
    </div>
  )
}

// ── Fighter card ───────────────────────────────────────────────────────────
function FighterCard({
  name,
  characterName,
  faction,
  hp,
  maxHp,
  align,
  showHp,
  isComeback,
}: {
  name: string
  characterName: string | null | undefined
  faction: FactionId | null | undefined
  hp: number
  maxHp: number
  align: 'left' | 'right'
  showHp: boolean
  isComeback: boolean
}) {
  const color = factionColor(faction)
  const isRight = align === 'right'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isRight ? 'row-reverse' : 'row',
        gap: '0.75rem',
        alignItems: 'flex-start',
        padding: '1rem',
        position: 'relative',
        background: `linear-gradient(${isRight ? '225deg' : '135deg'}, color-mix(in srgb, ${color} 8%, transparent), transparent 65%)`,
      }}
    >
      {/* Corner accent lines */}
      <div style={{ position: 'absolute', top: 0, [isRight ? 'right' : 'left']: 0, width: '32px', height: '2px', background: `linear-gradient(${isRight ? 'to left' : 'to right'}, ${color}, transparent)` }} />
      <div style={{ position: 'absolute', top: 0, [isRight ? 'right' : 'left']: 0, width: '2px', height: '32px', background: `linear-gradient(to bottom, ${color}, transparent)` }} />

      <FighterPortrait faction={faction} characterName={characterName} align={align} />

      <div style={{ flex: 1, display: 'grid', gap: '0.35rem', textAlign: isRight ? 'right' : 'left' }}>
        <div
          className="font-space-mono"
          style={{ fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text3)' }}
        >
          {faction ? faction.replace(/_/g, ' ') : 'Unregistered'}
        </div>
        <div
          className="font-cinzel"
          style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text1, var(--text2))', lineHeight: 1.2 }}
        >
          {name}
        </div>
        {characterName && characterName !== name && (
          <div
            className="font-cormorant"
            style={{ fontStyle: 'italic', fontSize: '0.78rem', color: 'var(--text3)', marginTop: '-0.15rem' }}
          >
            {characterName}
          </div>
        )}
        <div style={{ marginTop: '0.35rem' }}>
          <HPBar
            label={align === 'left' ? 'Challenger' : 'Defender'}
            value={hp}
            max={maxHp}
            align={align}
            showValue={showHp}
            faction={faction}
            isComeback={isComeback}
          />
        </div>
        {/* Ability type chip */}
        <div style={{ display: 'flex', justifyContent: isRight ? 'flex-end' : 'flex-start', marginTop: '0.2rem' }}>
          <div
            className="font-space-mono"
            style={{
              fontSize: '0.44rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '1px 6px',
              border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
              color,
              borderRadius: '1px',
            }}
          >
            {faction === 'agency' || faction === 'special_div' ? 'Analysis' :
              faction === 'hunting_dogs' ? 'Destruction' :
                faction === 'mafia' ? 'Destruction' :
                  faction === 'guild' ? 'Manipulation' : 'Operative'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function DuelScreenClient({
  initialDuel,
  initialRounds,
  viewer,
  moveConstraints: initialConstraints,
}: {
  initialDuel: Duel
  initialRounds: DuelRound[]
  viewer: Pick<Profile, 'id' | 'character_name' | 'character_ability'>
  moveConstraints: MoveConstraints
}) {
  const supabase = useMemo(() => createClient(), [])

  // ── Core state ────────────────────────────────────────────────────────
  const [duel, setDuel] = useState(initialDuel)
  const [rounds, setRounds] = useState(initialRounds)
  const [cooldowns, setCooldowns] = useState<DuelCooldown[]>([])
  const [gambitsRemaining, setGambitsRemaining] = useState(initialConstraints.gambitsRemaining)
  const [specialAvailable, setSpecialAvailable] = useState(initialConstraints.specialAvailable)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [optimisticSubmittedRound, setOptimisticSubmittedRound] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState('')
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [aftermathDismissed, setAftermathDismissed] = useState(false)
  const [aftermathSummary, setAftermathSummary] = useState<string | null>(null)
  const [aftermathApLabel, setAftermathApLabel] = useState<string | null>(null)
  const [challengerDisplay, setChallengerDisplay] = useState<string | null>(null)
  const [defenderDisplay, setDefenderDisplay] = useState<string | null>(null)
  const lastApRef = useRef<HTMLDivElement | null>(null)

  // ── Derived (memoized for performance) ─────────────────────────
  const isChallenger = useMemo(() => duel.challenger_id === viewer.id, [duel.challenger_id, viewer.id])
  const ownCharacter = useMemo(() => isChallenger ? duel.challenger_character : duel.defender_character, [isChallenger, duel])
  const ownHp = useMemo(() => isChallenger ? duel.challenger_hp : duel.defender_hp, [isChallenger, duel])
  const isComeback = useMemo(() => ownHp <= 20 && duel.status === 'active', [ownHp, duel.status])

  const currentRound = useMemo(() =>
    rounds.find((r) => r.round_number === duel.current_round) ??
    rounds[rounds.length - 1] ??
    null, [rounds, duel.current_round])

  const ownSubmitted = useMemo(() => Boolean(
    isChallenger ? currentRound?.challenger_move_submitted_at : currentRound?.defender_move_submitted_at,
  ), [isChallenger, currentRound])

  const previousRound = useMemo(() =>
    duel.current_round > 1
      ? rounds.find((r) => r.round_number === duel.current_round - 1) ?? null
      : null, [rounds, duel.current_round])

  const recoverLocked = useMemo(() =>
    (isChallenger ? previousRound?.challenger_move : previousRound?.defender_move) === 'recover',
    [isChallenger, previousRound])

  const specialLockedUntilRound = useMemo(() =>
    cooldowns.find((c) => c.user_id === viewer.id && c.ability_type === 'special')?.locked_until_round ?? null, [cooldowns, viewer.id])

  const specialEffectivelyLocked = useMemo(() =>
    !specialAvailable ||
    (specialLockedUntilRound !== null && specialLockedUntilRound > duel.current_round),
    [specialAvailable, specialLockedUntilRound, duel.current_round])

  const latestResolvedRound = useMemo(() => [...rounds].reverse().find((r) => r.resolved_at) ?? null, [rounds])

  const narrative = useMemo(() => latestResolvedRound
    ? getDisplayRoundNarrative(
      latestResolvedRound,
      duel.challenger_character ?? 'Operative',
      duel.defender_character ?? 'Operative',
    )
    : 'The city observes.', [latestResolvedRound, duel])

  const aftermathResult = useMemo(() =>
    duel.status === 'complete'
      ? duel.winner_id === viewer.id ? 'victory' : duel.winner_id === null ? 'draw' : 'defeat'
      : null, [duel, viewer.id])

  const fallbackAftermathApLabel = useMemo(() =>
    aftermathResult === 'victory' ? '+50 AP' : aftermathResult === 'defeat' ? '-20 AP' : '+5 AP', [aftermathResult])

  const isWaitingForOpponent = useMemo(() => ownSubmitted || optimisticSubmittedRound === currentRound?.round_number, [ownSubmitted, optimisticSubmittedRound, currentRound])

  const waitingLabel = useMemo(() =>
    duel.status === 'pending' ? 'Awaiting acceptance.' :
      isSubmitting ? 'Submitting move...' :
        isWaitingForOpponent ? 'Move submitted. Awaiting opponent.' :
          'Awaiting next move.', [duel.status, isSubmitting, isWaitingForOpponent])

  const rivalry = useMemo(() => getRivalry(duel.challenger_character_slug, duel.defender_character_slug), [duel.challenger_character_slug, duel.defender_character_slug])

  const totalRoundSeconds = useMemo(() => {
    if (!currentRound?.round_started_at || !currentRound?.round_deadline) return null
    return Math.round(
      (new Date(currentRound.round_deadline).getTime() - new Date(currentRound.round_started_at).getTime()) / 1000,
    )
  }, [currentRound?.round_started_at, currentRound?.round_deadline])

  // ── Recompute constraints from rounds on realtime update ─────────────────
  useEffect(() => {
    let gambits = 0
    let usedSpecial = false
    for (const r of rounds) {
      const move = isChallenger ? r.challenger_move : r.defender_move
      if (!move) continue
      if (move.toLowerCase() === 'gambit') gambits++
      if (move.toLowerCase() === 'special') usedSpecial = true
    }
    setGambitsRemaining(Math.max(0, 2 - gambits))
    setSpecialAvailable(!usedSpecial)
  }, [rounds, isChallenger])

  // ── Display name resolution ───────────────────────────────────────────
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const missingC = !duel.challenger_character
        const missingD = !duel.defender_character
        const fallbackC = duel.challenger_character ?? duel.challenger_faction ?? 'Unregistered'
        const fallbackD = duel.defender_character ?? duel.defender_faction ?? 'Unregistered'

        if (!missingC && !missingD) {
          if (active) { setChallengerDisplay(fallbackC); setDefenderDisplay(fallbackD) }
          return
        }

        const ids: string[] = []
        if (missingC && duel.challenger_id) ids.push(duel.challenger_id)
        if (missingD && duel.defender_id) ids.push(duel.defender_id)

        if (!ids.length) {
          if (active) { setChallengerDisplay(fallbackC); setDefenderDisplay(fallbackD) }
          return
        }

        const { data, error } = await supabase
          .from('profiles').select('id, username, character_name').in('id', ids)

        if (!active) return
        if (error || !data) { setChallengerDisplay(fallbackC); setDefenderDisplay(fallbackD); return }

        const map = new Map(
          (data as Array<{ id: string; username: string; character_name: string | null }>)
            .map((r) => [r.id, r]),
        )

        setChallengerDisplay(
          duel.challenger_character ?? map.get(duel.challenger_id ?? '')?.character_name ?? map.get(duel.challenger_id ?? '')?.username ?? fallbackC,
        )
        setDefenderDisplay(
          duel.defender_character ?? map.get(duel.defender_id ?? '')?.character_name ?? map.get(duel.defender_id ?? '')?.username ?? fallbackD,
        )
      } catch {
        if (!active) return
        setChallengerDisplay(duel.challenger_character ?? duel.challenger_faction ?? 'Unregistered')
        setDefenderDisplay(duel.defender_character ?? duel.defender_faction ?? 'Unregistered')
      }
    }
    void load()
    return () => { active = false }
  }, [
    duel.challenger_character, duel.defender_character,
    duel.challenger_id, duel.defender_id,
    duel.challenger_faction, duel.defender_faction, supabase,
  ])

  // ── Countdown timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (!currentRound?.round_deadline) { setCountdown(''); setSecondsLeft(null); return }
    const target = new Date(currentRound.round_deadline).getTime()
    const tick = () => {
      const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000))
      setSecondsLeft(remaining)
      setCountdown(`${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`)
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [currentRound?.round_deadline])

  // ── Realtime subscription ──────────────────────────────────────────────
  useEffect(() => {
    const SEL = 'id, duel_id, round_number, challenger_move, challenger_override_character, challenger_move_submitted_at, defender_move, defender_move_submitted_at, round_started_at, round_deadline, is_sudden_death, reversal_available, reversal_deadline, reversal_used, challenger_damage_dealt, defender_damage_dealt, challenger_hp_after, defender_hp_after, special_events, narrative, narrative_is_fallback, resolved_at'

    const refresh = async () => {
      const [rr, cr] = await Promise.all([
        supabase.from('duel_rounds').select(SEL).eq('duel_id', duel.id).order('round_number', { ascending: true }).limit(10),
        supabase.from('duel_cooldowns').select('id, duel_id, user_id, ability_type, locked_until_round').eq('duel_id', duel.id).limit(20),
      ])
      if (rr.data) setRounds(rr.data as DuelRound[])
      if (cr.data) setCooldowns(cr.data as DuelCooldown[])
    }

    const ch = supabase.channel(`duel:${duel.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'duels', filter: `id=eq.${duel.id}` }, (p) => setDuel(p.new as Duel))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duel_rounds', filter: `duel_id=eq.${duel.id}` }, () => void refresh())
      .subscribe()

    if (duel.status === 'active') void refresh()
    return () => { void supabase.removeChannel(ch) }
  }, [duel.id, duel.status, supabase])

  // ── Aftermath ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!aftermathResult || !lastApRef.current || aftermathResult === 'defeat') return
    triggerFloatingAP(lastApRef.current, aftermathResult === 'draw' ? 5 : 50)
  }, [aftermathResult])

  useEffect(() => { setAftermathDismissed(false) }, [duel.id, duel.status])

  useEffect(() => {
    if (!aftermathResult) { setAftermathSummary(null); setAftermathApLabel(null); return }
    let active = true
    const load = async () => {
      try {
        const res = await fetch(`/api/duels/${duel.id}/aftermath`, { cache: 'no-store' })
        const json = await res.json()
        if (!active || !res.ok) return
        setAftermathSummary(json.data?.summary ?? null)
        setAftermathApLabel(json.data?.apLabel ?? null)
      } catch { /* fallbacks used */ }
    }
    void load()
    return () => { active = false }
  }, [aftermathResult, duel.id])

  // ── Submit move (memoized) ──────────────────────────────────────────────
  const submitMove = useCallback(async (move: DuelMove) => {
    if (isSubmitting) return
    if (move === 'gambit' && gambitsRemaining <= 0) { setError('Gambit limit reached — 2 uses per duel.'); return }
    if (move === 'special' && specialEffectivelyLocked) { setError('Your special ability is not available this round.'); return }

    setError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/duels/submit-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duel_id: duel.id, move }),
      })
      const json = await res.json()

      if (!res.ok) {
        if (json?.error === 'SUDDEN_DEATH_RESTRICTED') setError('That move is locked during sudden-death rounds.')
        else if (json?.error === 'GAMBIT_LIMIT_REACHED') { setError('Gambit limit reached — 2 uses per duel.'); setGambitsRemaining(0) }
        else if (json?.error === 'SPECIAL_ALREADY_USED') { setError('Special ability already spent this duel.'); setSpecialAvailable(false) }
        else setError(json.error ?? 'Unable to submit move.')
        return
      }

      if (currentRound) setOptimisticSubmittedRound(currentRound.round_number)
      if (move === 'gambit') setGambitsRemaining((n) => Math.max(0, n - 1))
      if (move === 'special') setSpecialAvailable(false)

      // If both moves were submitted (opponent already moved), immediately refresh to catch resolution
      if (!json.waiting_for_opponent) {
        const SEL = 'id, duel_id, round_number, challenger_move, challenger_override_character, challenger_move_submitted_at, defender_move, defender_move_submitted_at, round_started_at, round_deadline, is_sudden_death, reversal_available, reversal_deadline, reversal_used, challenger_damage_dealt, defender_damage_dealt, challenger_hp_after, defender_hp_after, special_events, narrative, narrative_is_fallback, resolved_at'
        // Short delay to let the server finish resolving the round
        await new Promise((r) => window.setTimeout(r, 1500))
        const [rr, dr, cr] = await Promise.all([
          supabase.from('duel_rounds').select(SEL).eq('duel_id', duel.id).order('round_number', { ascending: true }).limit(10),
          supabase.from('duels').select('*').eq('id', duel.id).maybeSingle(),
          supabase.from('duel_cooldowns').select('id, duel_id, user_id, ability_type, locked_until_round').eq('duel_id', duel.id).limit(20),
        ])
        if (rr.data) setRounds(rr.data as DuelRound[])
        if (dr.data) setDuel(dr.data as Duel)
        if (cr.data) setCooldowns(cr.data as DuelCooldown[])
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, gambitsRemaining, specialEffectivelyLocked, duel.id, currentRound, supabase])

  // ── Fallback poll while waiting for opponent ────────────────────────────
  useEffect(() => {
    if (!isWaitingForOpponent || duel.status !== 'active') return

    const SEL = 'id, duel_id, round_number, challenger_move, challenger_override_character, challenger_move_submitted_at, defender_move, defender_move_submitted_at, round_started_at, round_deadline, is_sudden_death, reversal_available, reversal_deadline, reversal_used, challenger_damage_dealt, defender_damage_dealt, challenger_hp_after, defender_hp_after, special_events, narrative, narrative_is_fallback, resolved_at'

    const poll = async () => {
      const [rr, dr, cr] = await Promise.all([
        supabase.from('duel_rounds').select(SEL).eq('duel_id', duel.id).order('round_number', { ascending: true }).limit(10),
        supabase.from('duels').select('*').eq('id', duel.id).maybeSingle(),
        supabase.from('duel_cooldowns').select('id, duel_id, user_id, ability_type, locked_until_round').eq('duel_id', duel.id).limit(20),
      ])
      if (rr.data) setRounds(rr.data as DuelRound[])
      if (dr.data) setDuel(dr.data as Duel)
      if (cr.data) setCooldowns(cr.data as DuelCooldown[])
    }

    const id = window.setInterval(poll, 5000)
    return () => window.clearInterval(id)
  }, [isWaitingForOpponent, duel.status, duel.id, supabase])

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <>
      <PreAssignmentMessage userId={viewer.id} open={!viewer.character_name} />

      <div ref={lastApRef} style={{ display: 'grid', gap: '1rem', maxWidth: '800px', margin: '0 auto' }}>

        {/* ── Header strip ── */}
        <div
          className="font-space-mono"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.52rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text3)',
            padding: '0 0.25rem',
          }}
        >
          <span>Ability Duel · Yokohama Field</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {duel.status === 'active' && (
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#2a9d5c', boxShadow: '0 0 5px #2a9d5c' }} />
            )}
            <span>{`Round ${Math.max(duel.current_round, 1)} / ${DUEL_MAX_ROUNDS}`}</span>
          </div>
        </div>

        {/* ── War badge ── */}
        {duel.is_war_duel && (
          <div
            className="font-space-mono"
            style={{
              fontSize: '0.52rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--color-mafia, #CC1A1A)',
              padding: '0.28rem 0.65rem',
              border: '1px solid color-mix(in srgb, var(--color-mafia, #CC1A1A) 40%, transparent)',
              borderRadius: '1px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              width: 'fit-content',
            }}
          >
            ⚔ War Duel · +3 war points on win
          </div>
        )}

        {/* ── Rivalry banner ── */}
        {rivalry && (
          <div
            style={{
              padding: '0.5rem 0.85rem',
              borderLeft: '2px solid var(--accent)',
              background: 'color-mix(in srgb, var(--accent) 5%, transparent)',
              display: 'grid',
              gap: '0.18rem',
            }}
          >
            <div className="font-cinzel" style={{ fontSize: '0.72rem', color: 'var(--accent)' }}>
              {rivalry.label}
            </div>
            <div className="font-space-mono" style={{ fontSize: '0.5rem', color: 'var(--text3)', letterSpacing: '0.06em' }}>
              {rivalry.effect}
            </div>
          </div>
        )}

        {/* ── Fighter arena ── */}
        <section
          className="paper-surface"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            padding: 0,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Vertical divider */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '8px',
              bottom: '8px',
              width: '1px',
              background: `linear-gradient(to bottom, transparent, var(--border2) 25%, var(--border2) 75%, transparent)`,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          />

          <FighterCard
            name={challengerDisplay ?? duel.challenger_character ?? 'OPERATIVE'}
            characterName={duel.challenger_character}
            faction={duel.challenger_faction}
            hp={duel.challenger_hp}
            maxHp={duel.challenger_max_hp}
            align="left"
            showHp={isChallenger}
            isComeback={isChallenger && isComeback}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 0.25rem',
            }}
          >
            <span
              className="font-cinzel"
              style={{
                fontSize: '0.6rem',
                letterSpacing: '0.2em',
                color: 'var(--text3)',
                writingMode: 'vertical-rl',
              }}
            >
              VS
            </span>
          </div>

          <FighterCard
            name={defenderDisplay ?? duel.defender_character ?? 'OPERATIVE'}
            characterName={duel.defender_character}
            faction={duel.defender_faction}
            hp={duel.defender_hp}
            maxHp={duel.defender_max_hp}
            align="right"
            showHp={!isChallenger}
            isComeback={!isChallenger && isComeback}
          />
        </section>

        {/* ── Comeback indicator ── */}
        {isComeback && (
          <div
            className="font-cormorant"
            style={{
              fontStyle: 'italic',
              fontSize: '0.82rem',
              color: 'var(--color-mafia, #CC1A1A)',
              textAlign: 'center',
              padding: '0.4rem 0.75rem',
              border: '1px solid color-mix(in srgb, var(--color-mafia, #CC1A1A) 30%, transparent)',
              borderRadius: '2px',
              background: 'color-mix(in srgb, var(--color-mafia, #CC1A1A) 5%, transparent)',
            }}
          >
            Comeback threshold reached — +75 AP if you win.
          </div>
        )}

        {/* ── Narrative + moves ── */}
        <section className="paper-surface" style={{ padding: '1.25rem', display: 'grid', gap: '1rem' }}>

          {/* Timer bar — only when it's your turn */}
          {duel.status === 'active' && secondsLeft !== null && totalRoundSeconds && !isWaitingForOpponent && (
            <TimerBar secondsLeft={secondsLeft} totalSeconds={totalRoundSeconds} />
          )}

          <NarrativePanel narrative={narrative} />

          <DuelGuide
            variant="active"
            hasAssignedCharacter={Boolean(ownCharacter)}
            ownCharacterSlug={isChallenger ? duel.challenger_character_slug : duel.defender_character_slug}
            ownCharacterName={ownCharacter ?? 'Operative'}
            opponentCharacterSlug={isChallenger ? duel.defender_character_slug : duel.challenger_character_slug}
            opponentCharacterName={
              isChallenger
                ? defenderDisplay ?? duel.defender_character ?? 'Operative'
                : challengerDisplay ?? duel.challenger_character ?? 'Operative'
            }
          />

          {/* ── Move state ── */}
          {duel.status === 'pending' ? (
            <div style={{ padding: '0.85rem', textAlign: 'center', border: '1px solid var(--border2)', borderRadius: '2px' }}>
              <p className="font-cormorant" style={{ margin: 0, color: 'var(--text2)', fontStyle: 'italic' }}>
                This challenge is still awaiting the defender&apos;s response.
              </p>
            </div>
          ) : duel.status === 'active' && currentRound?.resolved_at === null && !isWaitingForOpponent && !isSubmitting ? (
            <>
              <div
                className="font-space-mono"
                style={{ fontSize: '0.5rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)' }}
              >
                Choose your move
              </div>
              <MoveButtons
                disabled={false}
                canUseSpecial={Boolean(ownCharacter)}
                specialLabel={viewer.character_ability ?? 'Ability Unregistered'}
                recoverLocked={recoverLocked}
                specialLockedUntilRound={specialEffectivelyLocked ? duel.current_round + 999 : null}
                gambitsRemaining={gambitsRemaining}
                currentRound={Math.max(duel.current_round, 1)}
                onSubmit={submitMove}
              />
            </>
          ) : duel.status === 'active' ? (
            <div style={{ padding: '0.85rem', textAlign: 'center', border: '1px solid var(--border2)', borderRadius: '2px' }}>
              <p className="font-cormorant" style={{ margin: 0, color: 'var(--text2)', fontStyle: 'italic' }}>
                {waitingLabel}
              </p>
              {countdown && (
                <div style={{ display: 'grid', gap: '0.3rem', marginTop: '0.5rem' }}>
                  {currentRound?.is_sudden_death && (
                    <p className="font-cormorant" style={{ margin: 0, color: 'var(--accent)', fontSize: '0.78rem', fontStyle: 'italic' }}>
                      Sudden death — Stance and Recover are locked.
                    </p>
                  )}
                  <div
                    className="font-space-mono"
                    style={{
                      color: secondsLeft !== null && secondsLeft <= 30 ? 'var(--color-mafia, #CC1A1A)' : 'var(--text3)',
                      fontSize: '0.56rem',
                    }}
                  >
                    {secondsLeft === 0 ? 'Auto-Stance — awaiting resolution' : countdown}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {error && (
            <p className="font-cormorant" style={{ margin: 0, color: '#8B0000', fontStyle: 'italic', fontSize: '0.88rem' }}>
              {error}
            </p>
          )}
        </section>

        {/* ── Round history ── */}
        <section className="paper-surface" style={{ padding: '1.25rem' }}>
          <div
            className="font-space-mono"
            style={{
              fontSize: '0.52rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--text3)',
              marginBottom: '1rem',
            }}
          >
            Round History
          </div>
          <RoundHistory
            rounds={rounds.filter((r) => r.resolved_at)}
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