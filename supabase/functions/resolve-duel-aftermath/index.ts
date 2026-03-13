// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const geminiKey = Deno.env.get('GEMINI_API_KEY')
const geminiModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-1.5-flash'

const headers = {
  apikey: serviceRoleKey ?? '',
  Authorization: `Bearer ${serviceRoleKey ?? ''}`,
  'Content-Type': 'application/json',
}

async function loadProfile(userId: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=id,faction,ap_total,rank,character_name,behavior_scores,duel_wins,duel_losses,duel_forfeits`, { headers })
  const [profile] = await response.json()
  return profile
}

function nextBehaviorScores(current: Record<string, unknown> | null | undefined) {
  const input = current && typeof current === 'object' ? current : {}
  return {
    power: typeof input.power === 'number' ? input.power + 2 : 2,
    intel: typeof input.intel === 'number' ? input.intel : 0,
    loyalty: typeof input.loyalty === 'number' ? input.loyalty : 0,
    control: typeof input.control === 'number' ? input.control : 0,
    arena_votes: input.arena_votes && typeof input.arena_votes === 'object' ? input.arena_votes : {},
    duel_style: input.duel_style && typeof input.duel_style === 'object' ? input.duel_style : { gambit: 0, strike: 0, stance: 0 },
    lore_topics: input.lore_topics && typeof input.lore_topics === 'object' ? input.lore_topics : {},
  }
}

async function loadRankThreshold(faction: string | null | undefined, apTotal: number) {
  if (!faction) {
    return 1
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rank_thresholds?faction=eq.${faction}&ap_required=lte.${apTotal}&select=rank&order=ap_required.desc&limit=1`, { headers })
  const [threshold] = await response.json()
  return threshold?.rank ?? 1
}

async function applyApAndRank(userId: string, amount: number) {
  await fetch(`${supabaseUrl}/rest/v1/rpc/award_ap`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ p_user_id: userId, p_amount: amount, p_event_type: 'duel_complete', p_metadata: { source: 'duel' } }),
  })

  const profile = await loadProfile(userId)
  const nextRank = await loadRankThreshold(profile?.faction, profile?.ap_total ?? 0)

  await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      rank: Math.max(profile?.rank ?? 1, nextRank),
    }),
  })

  return profile
}

async function aftermathNarrative(winner: string, loser: string) {
  const fallback = `The duel between ${winner} and ${loser} has concluded. The registry records this outcome.`
  if (!geminiKey) {
    return { text: fallback, isFallback: true }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are the Yokohama ability registry recording a completed duel.
Write exactly 2 sentences. No HP numbers, no AP. Present tense. BSD tone.
WINNER: ${winner}
LOSER: ${loser}
What does this outcome mean for Yokohama? Return ONLY 2 sentences.` }] }],
      }),
      signal: controller.signal,
    })
    if (!response.ok) {
      return { text: fallback, isFallback: true }
    }
    const json = await response.json()
    const text = json?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? '').join('').trim()
    return { text: text || fallback, isFallback: !text }
  } catch {
    return { text: fallback, isFallback: true }
  } finally {
    clearTimeout(timeout)
  }
}

serve(async (req) => {
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase credentials.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  const body = await req.json().catch(() => ({}))
  if (!body?.duel_id) {
    return new Response(JSON.stringify({ error: 'Missing duel_id.' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const duelResponse = await fetch(`${supabaseUrl}/rest/v1/duels?id=eq.${body.duel_id}&select=id,challenger_id,defender_id,challenger_character,defender_character,winner_id,loser_id,challenger_came_back,defender_came_back,is_war_duel,ap_awarded,status`, { headers })
  const [duel] = await duelResponse.json()
  if (!duel || duel.ap_awarded) {
    return new Response(JSON.stringify({ success: true, skipped: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  const winnerId = duel.winner_id
  const loserId = duel.loser_id
  const isDraw = !winnerId || !loserId
  const winnerAp = isDraw ? 5 : duel.challenger_came_back || duel.defender_came_back ? 75 : 50
  const loserAp = isDraw ? 5 : -20
  const narrative = await aftermathNarrative(duel.challenger_character ?? 'Operative', duel.defender_character ?? 'Operative')
  const challengerBefore = await loadProfile(duel.challenger_id)
  const defenderBefore = await loadProfile(duel.defender_id)

  if (isDraw) {
    await applyApAndRank(duel.challenger_id, 5)
    await applyApAndRank(duel.defender_id, 5)
  } else {
    await applyApAndRank(winnerId, winnerAp)
    await applyApAndRank(loserId, loserAp)
  }

  await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${duel.challenger_id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      behavior_scores: nextBehaviorScores(challengerBefore?.behavior_scores),
      duel_wins: (challengerBefore?.duel_wins ?? 0) + (!isDraw && duel.winner_id === duel.challenger_id ? 1 : 0),
      duel_losses: (challengerBefore?.duel_losses ?? 0) + (!isDraw && duel.loser_id === duel.challenger_id ? 1 : 0),
      duel_forfeits: (challengerBefore?.duel_forfeits ?? 0) + (duel.status === 'forfeit' && duel.loser_id === duel.challenger_id ? 1 : 0),
    }),
  })

  await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${duel.defender_id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      behavior_scores: nextBehaviorScores(defenderBefore?.behavior_scores),
      duel_wins: (defenderBefore?.duel_wins ?? 0) + (!isDraw && duel.winner_id === duel.defender_id ? 1 : 0),
      duel_losses: (defenderBefore?.duel_losses ?? 0) + (!isDraw && duel.loser_id === duel.defender_id ? 1 : 0),
      duel_forfeits: (defenderBefore?.duel_forfeits ?? 0) + (duel.status === 'forfeit' && duel.loser_id === duel.defender_id ? 1 : 0),
    }),
  })

  await fetch(`${supabaseUrl}/rest/v1/duels?id=eq.${duel.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ ap_awarded: true, completed_at: new Date().toISOString() }),
  })

  await fetch(`${supabaseUrl}/rest/v1/notifications`, {
    method: 'POST',
    headers,
    body: JSON.stringify([
      {
        user_id: duel.challenger_id,
        type: 'duel_complete',
        message: narrative.text,
        reference_id: duel.id,
        action_url: `/duels/${duel.id}`,
        payload: { duel_id: duel.id, ap_change: isDraw ? 5 : duel.winner_id === duel.challenger_id ? winnerAp : loserAp },
      },
      {
        user_id: duel.defender_id,
        type: 'duel_complete',
        message: narrative.text,
        reference_id: duel.id,
        action_url: `/duels/${duel.id}`,
        payload: { duel_id: duel.id, ap_change: isDraw ? 5 : duel.winner_id === duel.defender_id ? winnerAp : loserAp },
      },
    ]),
  })

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
})
