import { supabaseAdmin } from '@/backend/lib/supabase'
import type { Duel, DuelCooldown, DuelRound } from '@/backend/types'
import { resolveDuelRound } from '@/lib/duels/engine'
import { narrateDuelRound } from '@/backend/lib/duel-narrative'

export const DUEL_MAX_ROUNDS = 7
export const DUEL_SUDDEN_DEATH_ROUND = 8
export const DUEL_ROUND_DURATION_MS = 2 * 60 * 1000

function duelSelect() {
  return 'id, challenger_id, defender_id, challenger_character, defender_character, challenger_character_slug, defender_character_slug, status, current_round, challenger_hp, defender_hp, challenger_max_hp, defender_max_hp, challenger_came_back, defender_came_back'
}

async function triggerAftermathIfPossible(duelId: string) {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return
  }

  try {
    await fetch(`${supabaseUrl}/functions/v1/resolve-duel-aftermath`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ duel_id: duelId }),
    })
  } catch {
    // Ignore local/dev aftermath failures.
  }
}

async function upsertCooldowns(duelId: string, cooldowns: Array<{ user_id: string; ability_type: 'special' | 'recover'; locked_until_round: number }>) {
  for (const cooldown of cooldowns) {
    await supabaseAdmin
      .from('duel_cooldowns')
      .upsert({
        duel_id: duelId,
        user_id: cooldown.user_id,
        ability_type: cooldown.ability_type,
        locked_until_round: cooldown.locked_until_round,
      }, { onConflict: 'duel_id,user_id,ability_type' })
  }
}

export async function resolveDuelRoundWithAdmin(duelId: string) {
  const { data: duelData } = await supabaseAdmin
    .from('duels')
    .select(duelSelect())
    .eq('id', duelId)
    .maybeSingle()

  const duel = duelData as Pick<
    Duel,
    | 'id'
    | 'challenger_id'
    | 'defender_id'
    | 'challenger_character'
    | 'defender_character'
    | 'challenger_character_slug'
    | 'defender_character_slug'
    | 'status'
    | 'current_round'
    | 'challenger_hp'
    | 'defender_hp'
    | 'challenger_max_hp'
    | 'defender_max_hp'
    | 'challenger_came_back'
    | 'defender_came_back'
  > | null

  if (!duel || duel.status !== 'active') {
    return false
  }

  const [roundResult, previousRoundsResult, cooldownsResult] = await Promise.all([
    supabaseAdmin
      .from('duel_rounds')
      .select('id, duel_id, round_number, challenger_move, defender_move, resolved_at')
      .eq('duel_id', duelId)
      .eq('round_number', duel.current_round)
      .maybeSingle(),
    supabaseAdmin
      .from('duel_rounds')
      .select('round_number, challenger_move, defender_move, challenger_hp_after, defender_hp_after, special_events')
      .eq('duel_id', duelId)
      .lt('round_number', duel.current_round)
      .order('round_number', { ascending: true })
      .limit(10),
    supabaseAdmin
      .from('duel_cooldowns')
      .select('duel_id, user_id, ability_type, locked_until_round')
      .eq('duel_id', duelId)
      .limit(20),
  ])

  const round = roundResult.data as Pick<DuelRound, 'id' | 'duel_id' | 'round_number' | 'challenger_move' | 'defender_move' | 'resolved_at'> | null
  const previousRounds = ((previousRoundsResult.data as DuelRound[] | null) ?? [])
  const cooldowns = ((cooldownsResult.data as DuelCooldown[] | null) ?? [])

  if (!round || round.resolved_at || !round.challenger_move || !round.defender_move) {
    return false
  }

  const resolution = resolveDuelRound({
    roundNumber: duel.current_round,
    challenger: {
      id: duel.challenger_id,
      name: duel.challenger_character ?? 'Operative',
      slug: duel.challenger_character_slug,
      hp: duel.challenger_hp,
      maxHp: duel.challenger_max_hp,
      move: round.challenger_move,
    },
    defender: {
      id: duel.defender_id,
      name: duel.defender_character ?? 'Operative',
      slug: duel.defender_character_slug,
      hp: duel.defender_hp,
      maxHp: duel.defender_max_hp,
      move: round.defender_move,
    },
    previousRounds,
    cooldowns,
  })

  const now = new Date().toISOString()

  const narrative = await narrateDuelRound({
    challengerName: duel.challenger_character ?? 'Operative',
    challengerSlug: duel.challenger_character_slug ?? null,
    defenderName: duel.defender_character ?? 'Operative',
    defenderSlug: duel.defender_character_slug ?? null,
    challengerMove: resolution.challengerMove,
    defenderMove: resolution.defenderMove,
    challengerDamage: resolution.challengerDamage,
    defenderDamage: resolution.defenderDamage,
    roundNumber: duel.current_round,
    duelOver: resolution.duelOver,
    winnerName:
      resolution.winnerId === duel.challenger_id
        ? duel.challenger_character ?? 'Operative'
        : resolution.winnerId === duel.defender_id
          ? duel.defender_character ?? 'Operative'
          : null,
    specialEvents: resolution.specialEvents,
  })

  await supabaseAdmin
    .from('duel_rounds')
    .update({
      challenger_move: resolution.challengerMove,
      defender_move: resolution.defenderMove,
      challenger_damage_dealt: resolution.challengerDamage,
      defender_damage_dealt: resolution.defenderDamage,
      challenger_hp_after: resolution.challengerHpAfter,
      defender_hp_after: resolution.defenderHpAfter,
      special_events: resolution.specialEvents,
      narrative: narrative.text,
      narrative_is_fallback: narrative.isFallback,
      resolved_at: now,
    })
    .eq('id', round.id)

  await upsertCooldowns(duel.id, resolution.cooldownWrites)

  // Extended rounds / sudden death handling
  const MAX_NORMAL_ROUNDS = DUEL_MAX_ROUNDS
  const SUDDEN_DEATH_ROUND = DUEL_SUDDEN_DEATH_ROUND
  const isSuddenDeath = duel.current_round === SUDDEN_DEATH_ROUND

  // In sudden death, damage is multiplied by 1.5 and stance/recover are blocked at submission.
  const finalNextA = isSuddenDeath
    ? Math.max(0, duel.challenger_hp - Math.round(resolution.defenderDamage * 1.5))
    : resolution.challengerHpAfter
  const finalNextB = isSuddenDeath
    ? Math.max(0, duel.defender_hp - Math.round(resolution.challengerDamage * 1.5))
    : resolution.defenderHpAfter

  let duelOver = false
  let winnerId: string | null = null
  let loserId: string | null = null

  duelOver = finalNextA <= 0 || finalNextB <= 0 || duel.current_round >= SUDDEN_DEATH_ROUND

  if (duelOver) {
    if (finalNextA === finalNextB && duel.current_round >= SUDDEN_DEATH_ROUND) {
      // Use cumulative damage across rounds as tiebreaker; challenger wins ties
      const { data: dmgRounds } = await supabaseAdmin
        .from('duel_rounds')
        .select('challenger_damage_dealt, defender_damage_dealt')
        .eq('duel_id', duel.id)

      const totalChallengerDmg = (dmgRounds ?? []).reduce((s: number, r: any) => s + (r.challenger_damage_dealt ?? 0), 0)
      const totalDefenderDmg = (dmgRounds ?? []).reduce((s: number, r: any) => s + (r.defender_damage_dealt ?? 0), 0)
      winnerId = totalChallengerDmg >= totalDefenderDmg ? duel.challenger_id : duel.defender_id
    } else {
      winnerId = finalNextA === finalNextB ? null : finalNextA > finalNextB ? duel.challenger_id : duel.defender_id
    }
    loserId = winnerId === duel.challenger_id ? duel.defender_id : winnerId === duel.defender_id ? duel.challenger_id : null
  }

  // After 7 normal rounds, if both are alive, go to sudden death
  const goToSuddenDeath = !duelOver && duel.current_round >= MAX_NORMAL_ROUNDS && finalNextA > 0 && finalNextB > 0

  if (duelOver) {
    const winnerCameBack = winnerId === duel.challenger_id && finalNextA <= 20
    const loserCameBack = winnerId === duel.defender_id && finalNextB <= 20

    await supabaseAdmin
      .from('duels')
      .update({
        status: 'complete',
        winner_id: winnerId,
        loser_id: loserId,
        challenger_hp: finalNextA,
        defender_hp: finalNextB,
        challenger_max_hp: resolution.challengerMaxHpAfter,
        defender_max_hp: resolution.defenderMaxHpAfter,
        challenger_came_back: winnerCameBack || duel.challenger_came_back,
        defender_came_back: loserCameBack || duel.defender_came_back,
        completed_at: now,
      })
      .eq('id', duel.id)

    await triggerAftermathIfPossible(duel.id)
    return true
  }

  const nextRoundNumber = goToSuddenDeath ? SUDDEN_DEATH_ROUND : duel.current_round + 1

  await supabaseAdmin
    .from('duels')
    .update({
      current_round: nextRoundNumber,
      challenger_hp: finalNextA,
      defender_hp: finalNextB,
      challenger_max_hp: resolution.challengerMaxHpAfter,
      defender_max_hp: resolution.defenderMaxHpAfter,
    })
    .eq('id', duel.id)

  // Insert next round, setting is_sudden_death if available
  try {
    await supabaseAdmin.from('duel_rounds').insert({
      duel_id: duel.id,
      round_number: nextRoundNumber,
      round_started_at: now,
      round_deadline: new Date(Date.now() + DUEL_ROUND_DURATION_MS).toISOString(),
      is_sudden_death: goToSuddenDeath || isSuddenDeath,
    })
  } catch (_) {
    await supabaseAdmin.from('duel_rounds').insert({
      duel_id: duel.id,
      round_number: nextRoundNumber,
      round_started_at: now,
      round_deadline: new Date(Date.now() + DUEL_ROUND_DURATION_MS).toISOString(),
    })
  }

  // Trigger bot move instantly if either participant is a bot
  try {
    const { data: participants } = await supabaseAdmin
      .from('profiles')
      .select('id, is_bot')
      .in('id', [duel.challenger_id, duel.defender_id])

    const hasBot = (participants ?? []).some((p: any) => p.is_bot)

    if (hasBot) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
      const botDuelSecret = process.env.BOT_DUEL_SECRET ?? ''
      if (appUrl && botDuelSecret) {
        fetch(`${appUrl}/api/bots/submit-duel-move`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-bot-duel-secret': botDuelSecret,
          },
          body: JSON.stringify({}),
        }).catch(() => null)
      }
    }
  } catch {}

  return true
}
