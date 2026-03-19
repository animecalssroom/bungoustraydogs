import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { supabaseAdmin } from '@/backend/lib/supabase'
import type { BehaviorScores, Duel, DuelMove, DuelRound, Profile } from '@/backend/types'
import { normalizeBehaviorScores } from '@/frontend/lib/behavior'
import { resolveDuelRoundWithAdmin } from '@/backend/lib/duel-runtime'

const SubmitMoveSchema = z.object({
  duel_id: z.string().uuid(),
  move: z.enum(['strike', 'stance', 'gambit', 'special', 'recover']),
  gogol_override_character: z.string().optional(),
  bot_user_id: z.string().uuid().optional(),
})

function applyDuelStyle(scores: BehaviorScores | null | undefined, move: DuelMove) {
  const next = normalizeBehaviorScores(scores)
  if (move === 'gambit' || move === 'strike' || move === 'stance') {
    next.duel_style[move] += 1
  }
  return next
}

async function resolveActor(request: NextRequest, payload: z.infer<typeof SubmitMoveSchema>) {
  const botSecret = request.headers.get('x-bot-secret')
  const expectedBotSecret = process.env.BOT_DUEL_SECRET

  if (expectedBotSecret && botSecret === expectedBotSecret && payload.bot_user_id) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, username, role, faction, character_name, character_match_id, rank, duel_wins, duel_losses, is_bot, behavior_scores, avg_move_speed_minutes, duel_moves_count')
      .eq('id', payload.bot_user_id)
      .eq('is_bot', true)
      .maybeSingle()

    if (data) {
      return {
        user: { id: data.id },
        profile: data as unknown as Profile,
      }
    }
  }

  const auth = await requireAuth(request)
  if (isNextResponse(auth)) {
    return auth
  }

  return auth
}

async function triggerResolverOrFallback(duelId: string) {
  const localResult = await resolveDuelRoundWithAdmin(duelId)
  if (localResult) {
    return true
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && serviceRoleKey) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/resolve-duel-round`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ duel_id: duelId }),
      })

      if (response.ok) {
        return true
      }
    } catch {
      return false
    }
  }

  return false
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = SubmitMoveSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid duel move payload.' }, { status: 400 })
  }

  const auth = await resolveActor(request, parsed.data)
  if (isNextResponse(auth)) return auth

  const { data: duelData } = await supabaseAdmin
    .from('duels')
    .select('id, challenger_id, defender_id, challenger_character, defender_character, challenger_character_slug, defender_character_slug, status, current_round')
    .eq('id', parsed.data.duel_id)
    .maybeSingle()

  const duel = (duelData as Pick<
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
  > | null) ?? null

  if (!duel || (duel.challenger_id != auth.user.id && duel.defender_id != auth.user.id)) {
    return NextResponse.json({ error: 'This duel is not on your file.' }, { status: 400 })
  }

  if (duel.status !== 'active') {
    return NextResponse.json({ error: 'This duel is not active.' }, { status: 400 })
  }

  const { data: roundData } = await supabaseAdmin
    .from('duel_rounds')
    .select('id, duel_id, round_number, challenger_move, challenger_override_character, challenger_move_submitted_at, defender_move, defender_move_submitted_at, round_started_at, resolved_at')
    .eq('duel_id', duel.id)
    .eq('round_number', duel.current_round)
    .is('resolved_at', null)
    .maybeSingle()

  const round = (roundData as Pick<
    DuelRound,
    | 'id'
    | 'duel_id'
    | 'round_number'
    | 'challenger_move'
    | 'challenger_override_character'
    | 'challenger_move_submitted_at'
    | 'defender_move'
    | 'defender_move_submitted_at'
    | 'round_started_at'
    | 'resolved_at'
  > | null) ?? null

  if (!round) {
    return NextResponse.json({ error: 'No unresolved round is available.' }, { status: 400 })
  }

  const isChallenger = duel.challenger_id === auth.user.id
  const moveField = isChallenger ? 'challenger_move' : 'defender_move'
  const moveSubmittedField = isChallenger
    ? 'challenger_move_submitted_at'
    : 'defender_move_submitted_at'

  if (isChallenger ? round.challenger_move_submitted_at : round.defender_move_submitted_at) {
    return NextResponse.json({ error: 'You have already submitted a move for this round.' }, { status: 400 })
  }

  const playerCharacterName = isChallenger ? duel.challenger_character : duel.defender_character
  const playerCharacterSlug = isChallenger
    ? duel.challenger_character_slug
    : duel.defender_character_slug

  if (parsed.data.move === 'special' && !playerCharacterName) {
    return NextResponse.json({ error: 'ABILITY_UNREGISTERED' }, { status: 400 })
  }

  if (parsed.data.move === 'special') {
    const { data: cooldown } = await supabaseAdmin
      .from('duel_cooldowns')
      .select('locked_until_round')
      .eq('duel_id', duel.id)
      .eq('user_id', auth.user.id)
      .eq('ability_type', 'special')
      .gt('locked_until_round', duel.current_round)
      .limit(1)
      .maybeSingle()

    if (cooldown) {
      return NextResponse.json({ error: 'ON_COOLDOWN' }, { status: 400 })
    }
    // Enforce max 2 uses of `special` per player in a duel
    const { data: specialRows } = await supabaseAdmin
      .from('duel_rounds')
      .select('id')
      .eq('duel_id', duel.id)
      .eq(isChallenger ? 'challenger_move' : 'defender_move', 'special')
      .limit(1000)

    if ((specialRows ?? []).length >= 2) {
      return NextResponse.json({ error: 'SPECIAL_LIMIT_EXCEEDED' }, { status: 400 })
    }
  }

  // Enforce max 2 uses of `gambit` per player in a duel
  if (parsed.data.move === 'gambit') {
    const { data: gambitRows } = await supabaseAdmin
      .from('duel_rounds')
      .select('id')
      .eq('duel_id', duel.id)
      .eq(isChallenger ? 'challenger_move' : 'defender_move', 'gambit')
      .limit(1000)

    if ((gambitRows ?? []).length >= 2) {
      return NextResponse.json({ error: 'GAMBIT_LIMIT_EXCEEDED' }, { status: 400 })
    }
  }
  if (parsed.data.move === 'recover' && duel.current_round > 1) {
    const { data: previousRound } = await supabaseAdmin
      .from('duel_rounds')
      .select('challenger_move, defender_move')
      .eq('duel_id', duel.id)
      .eq('round_number', duel.current_round - 1)
      .maybeSingle()

    const previousMove = isChallenger ? previousRound?.challenger_move : previousRound?.defender_move
    if (previousMove === 'recover') {
      return NextResponse.json({ error: 'RECOVER_LOCKED' }, { status: 400 })
    }
  }

  // Block STANCE and RECOVER in sudden death round
  if (duel.current_round === 8) {
    if (parsed.data.move === 'stance' || parsed.data.move === 'recover') {
      return NextResponse.json({ error: 'SUDDEN_DEATH_RESTRICTED' }, { status: 400 })
    }
  }

  if (parsed.data.gogol_override_character) {
    if (playerCharacterSlug !== 'nikolai-gogol' || parsed.data.move !== 'special') {
      return NextResponse.json({ error: 'INVALID_GOGOL_OVERRIDE' }, { status: 400 })
    }

    const { data: existingOverride } = await supabaseAdmin
      .from('duel_rounds')
      .select('id')
      .eq('duel_id', duel.id)
      .not('challenger_override_character', 'is', null)
      .limit(1)
      .maybeSingle()

    if (existingOverride && isChallenger) {
      return NextResponse.json({ error: 'INVALID_GOGOL_OVERRIDE' }, { status: 400 })
    }
  }

  const submittedAt = new Date().toISOString()
  const roundStartedAt = new Date(round.round_started_at).getTime()
  const deltaMinutes = Math.max(0, (Date.now() - roundStartedAt) / 60000)
  const moveCount = auth.profile.duel_moves_count ?? 0
  const existingAverage = auth.profile.avg_move_speed_minutes ?? 0
  const nextAverage = moveCount > 0 ? (existingAverage * moveCount + deltaMinutes) / (moveCount + 1) : deltaMinutes
  const nextBehaviorScores = applyDuelStyle(auth.profile.behavior_scores, parsed.data.move)

  const updates: Record<string, unknown> = {
    [moveField]: parsed.data.move,
    [moveSubmittedField]: submittedAt,
  }

  if (isChallenger && parsed.data.gogol_override_character) {
    updates.challenger_override_character = parsed.data.gogol_override_character
  }

  await supabaseAdmin.from('duel_rounds').update(updates).eq('id', round.id)

  await supabaseAdmin
    .from('profiles')
    .update({
      behavior_scores: nextBehaviorScores,
      avg_move_speed_minutes: Number(nextAverage.toFixed(2)),
      duel_moves_count: moveCount + 1,
      updated_at: submittedAt,
    } satisfies Partial<Profile>)
    .eq('id', auth.user.id)

  const { data: refreshedRound } = await supabaseAdmin
    .from('duel_rounds')
    .select('challenger_move_submitted_at, defender_move_submitted_at')
    .eq('id', round.id)
    .maybeSingle()

  const bothSubmitted = Boolean(
    refreshedRound?.challenger_move_submitted_at && refreshedRound?.defender_move_submitted_at,
  )

  const opponentId = isChallenger ? duel.defender_id : duel.challenger_id
  await supabaseAdmin.from('notifications').insert({
    user_id: opponentId,
    type: 'duel_update',
    message: 'Opponent has submitted their move.',
    reference_id: duel.id,
    action_url: `/duels/${duel.id}`,
    payload: {
      duel_id: duel.id,
      round_number: duel.current_round,
    },
  })
  try { await import('@/backend/lib/notifications-cache').then(m=>m.invalidateNotificationsCache(opponentId)) } catch (err) { console.error('[notifications] invalidate error', err) }

  if (bothSubmitted) {
    await triggerResolverOrFallback(duel.id)
  }

  return NextResponse.json({
    success: true,
    waiting_for_opponent: !bothSubmitted,
  })
}
