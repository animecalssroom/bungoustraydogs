import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { chooseBotMove, type BotDuelStrategy } from '@/lib/duels/npc-logic'

export const maxDuration = 60

const STRATEGY_BY_CHARACTER: Record<string, BotDuelStrategy> = {
  'kenji-miyazawa': 'PATIENT_DESTRUCTION',
  'gin-akutagawa': 'COUNTER_WAIT',
  'tachihara-michizou': 'GAMBIT_CHAOS',
  'mark-twain': 'GAMBIT_CHAOS',
  'louisa-may-alcott': 'CALCULATED_HEAL',
  'akiko-yosano': 'CALCULATED_HEAL',
  'edgar-allan-poe': 'TRAP_THEN_WAIT',
}

function strategyFor(slug: string | null | undefined): BotDuelStrategy {
  return (slug ? STRATEGY_BY_CHARACTER[slug] : null) ?? 'PATIENT_DESTRUCTION'
}

// Count how many times a user has played a specific move in a duel
function countMove(
  rounds: Array<{ challenger_move: string | null; defender_move: string | null }>,
  isChallenger: boolean,
  move: string,
): number {
  return rounds.filter(
    (r) => (isChallenger ? r.challenger_move : r.defender_move) === move,
  ).length
}

async function submitBotMove(
  request: NextRequest,
  secret: string,
  duelId: string,
  botUserId: string,
  duel: {
    challenger_id: string
    current_round: number
    challenger_hp: number
    defender_hp: number
    challenger_character_slug: string | null
    defender_character_slug: string | null
  },
) {
  const isChallenger = botUserId === duel.challenger_id
  const hp = isChallenger ? duel.challenger_hp : duel.defender_hp
  const characterSlug = isChallenger
    ? duel.challenger_character_slug
    : duel.defender_character_slug

  // Fetch resolved rounds to count spent moves
  const { data: priorRounds } = await supabaseAdmin
    .from('duel_rounds')
    .select('challenger_move, defender_move')
    .eq('duel_id', duelId)
    .not('resolved_at', 'is', null)

  const rounds = (priorRounds ?? []) as Array<{
    challenger_move: string | null
    defender_move: string | null
  }>

  const gambitsUsed = countMove(rounds, isChallenger, 'gambit')
  const specialUsed = countMove(rounds, isChallenger, 'special') > 0

  const strategy = strategyFor(characterSlug)
  const move = chooseBotMove(strategy, duel.current_round, hp, gambitsUsed, specialUsed)

  await fetch(new URL('/api/duels/submit-move', request.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-bot-secret': secret },
    body: JSON.stringify({ duel_id: duelId, move, bot_user_id: botUserId }),
  }).catch(() => null)

  return move
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-bot-secret')
  if (!process.env.BOT_DUEL_SECRET || secret !== process.env.BOT_DUEL_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const processed: string[] = []
  const accepted: string[] = []

  // ── Single target (manual / direct call) ──────────────────────────────
  if (body?.duel_id && body?.bot_user_id) {
    const duelId = String(body.duel_id)
    const botUserId = String(body.bot_user_id)

    const { data: duel } = await supabaseAdmin
      .from('duels')
      .select('id, challenger_id, defender_id, challenger_character_slug, defender_character_slug, current_round, challenger_hp, defender_hp')
      .eq('id', duelId)
      .maybeSingle()

    if (!duel) {
      return NextResponse.json({ error: 'Duel not found' }, { status: 404 })
    }

    await submitBotMove(request, secret, duelId, botUserId, duel)
    processed.push(duelId)
    return NextResponse.json({ success: true, processed })
  }

  // ── Accept pending duels where defender is a bot ──────────────────────
  const { data: pendingDuels } = await supabaseAdmin
    .from('duels')
    .select('id, defender_id')
    .eq('status', 'pending')
    .limit(10)

  if (pendingDuels?.length) {
    const defenderIds = [...new Set(pendingDuels.map((d) => d.defender_id))]
    const { data: defenderProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, is_bot')
      .in('id', defenderIds)

    const botIds = new Set(
      (defenderProfiles ?? []).filter((p) => p.is_bot).map((p) => p.id),
    )

    for (const pDuel of pendingDuels) {
      if (!botIds.has(pDuel.defender_id)) continue

      await fetch(new URL('/api/duels/accept', request.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-bot-secret': secret },
        body: JSON.stringify({ duel_id: pDuel.id, bot_user_id: pDuel.defender_id }),
      }).catch((e) => console.error(`[bot-duel] failed to accept duel ${pDuel.id}:`, e))

      accepted.push(pDuel.id)
    }
  }

  // ── Submit moves for active duels ─────────────────────────────────────
  const { data: activeDuels } = await supabaseAdmin
    .from('duels')
    .select('id, challenger_id, defender_id, challenger_character_slug, defender_character_slug, current_round, challenger_hp, defender_hp')
    .eq('status', 'active')
    .limit(20)

  if (activeDuels?.length) {
    // Batch fetch all participant profiles
    const participantIds = [
      ...new Set(activeDuels.flatMap((d) => [d.challenger_id, d.defender_id])),
    ]
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, is_bot')
      .in('id', participantIds)

    const botProfileIds = new Set(
      (profiles ?? []).filter((p) => p.is_bot).map((p) => p.id),
    )

    // Batch fetch current unresolved rounds
    const duelIds = activeDuels.map((d) => d.id)
    const { data: allRounds } = await supabaseAdmin
      .from('duel_rounds')
      .select('id, duel_id, round_number, challenger_move_submitted_at, defender_move_submitted_at')
      .in('duel_id', duelIds)
      .is('resolved_at', null)

    const roundByDuelId = new Map(
      (allRounds ?? []).map((r) => [r.duel_id, r]),
    )

    for (const duel of activeDuels) {
      const round = roundByDuelId.get(duel.id)
      if (!round) continue

      const botTargets: string[] = []
      if (botProfileIds.has(duel.challenger_id) && !round.challenger_move_submitted_at) {
        botTargets.push(duel.challenger_id)
      }
      if (botProfileIds.has(duel.defender_id) && !round.defender_move_submitted_at) {
        botTargets.push(duel.defender_id)
      }

      for (const botUserId of botTargets) {
        await submitBotMove(request, secret, duel.id, botUserId, duel)
        processed.push(duel.id)
      }
    }
  }

  // ── Scavenge open challenges where a bot could participate ────────────
  const { data: openChallenges } = await supabaseAdmin
    .from('open_challenges')
    .select('id, challenger_id, faction')
    .eq('status', 'open')
    .gt('expires_at', new Date().toISOString())
    .limit(10)

  if (openChallenges?.length) {
    // Fetch all bot profiles to find candidates
    const { data: botProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, faction, username')
      .eq('is_bot', true)
      .eq('is_bot_paused', false)

    if (botProfiles?.length) {
      // BATCH: Pre-fetch current duel counts for all candidate bots (removes loop query)
      const botProfileIds = botProfiles.map(b => b.id)
      const { data: counts } = await supabaseAdmin
        .from('duels')
        .select('challenger_id, defender_id')
        .or(`challenger_id.in.(${botProfileIds.join(',')}),defender_id.in.(${botProfileIds.join(',')})`)
        .in('status', ['pending', 'active'])

      const duelCounts = new Map<string, number>()
      botProfileIds.forEach(id => duelCounts.set(id, 0))
      
      counts?.forEach(d => {
        if (duelCounts.has(d.challenger_id)) duelCounts.set(d.challenger_id, (duelCounts.get(d.challenger_id) || 0) + 1)
        if (duelCounts.has(d.defender_id)) duelCounts.set(d.defender_id, (duelCounts.get(d.defender_id) || 0) + 1)
      })

      for (const challenge of openChallenges) {
        // Find a bot candidate who: 
        // 1. Is in a different faction
        // 2. Has < 3 active duels (checked via local map)
        const candidate = botProfiles.find((b) => {
          if (b.faction === challenge.faction || b.id === challenge.challenger_id) return false
          const count = duelCounts.get(b.id) || 0
          return count < 3
        })

        if (!candidate) continue

        // Update local counter so we don't over-assign in this same loop
        duelCounts.set(candidate.id, (duelCounts.get(candidate.id) || 0) + 1)

        await fetch(new URL('/api/duels/accept-open', request.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-bot-secret': secret },
          body: JSON.stringify({ open_challenge_id: challenge.id, bot_user_id: candidate.id }),
        }).catch((e) => console.error(`[bot-duel] failed to scavenge challenge ${challenge.id}:`, e))

        accepted.push(challenge.id)
      }
    }
  }

  return NextResponse.json({ success: true, accepted, processed })
}