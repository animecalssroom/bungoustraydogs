import { supabaseAdmin } from '@/backend/lib/supabase'
import type { Duel, DuelCooldown, DuelRound } from '@/backend/types'
import { resolveDuelRound } from '@/lib/duels/engine'
import { narrateDuelRound } from '@/backend/lib/duel-narrative'
import { DUEL_ROUND_DURATION_MS } from '@/lib/duels/shared'

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

  if (resolution.duelOver) {
    const winnerCameBack = resolution.winnerId === duel.challenger_id && resolution.challengerHpAfter <= 20
    const loserCameBack = resolution.winnerId === duel.defender_id && resolution.defenderHpAfter <= 20

    await supabaseAdmin
      .from('duels')
      .update({
        status: 'complete',
        winner_id: resolution.winnerId,
        loser_id: resolution.loserId,
        challenger_hp: resolution.challengerHpAfter,
        defender_hp: resolution.defenderHpAfter,
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

  const nextRoundNumber = duel.current_round + 1

  await supabaseAdmin
    .from('duels')
    .update({
      current_round: nextRoundNumber,
      challenger_hp: resolution.challengerHpAfter,
      defender_hp: resolution.defenderHpAfter,
      challenger_max_hp: resolution.challengerMaxHpAfter,
      defender_max_hp: resolution.defenderMaxHpAfter,
    })
    .eq('id', duel.id)

  await supabaseAdmin.from('duel_rounds').insert({
    duel_id: duel.id,
    round_number: nextRoundNumber,
    round_started_at: now,
    round_deadline: new Date(Date.now() + DUEL_ROUND_DURATION_MS).toISOString(),
  })

  return true
}
