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

function damageForMove(move: string) {
  if (move === 'recover') return { damage: 0, heal: 20, reduction: 0 }
  if (move === 'stance') return { damage: Math.floor(Math.random() * 6) + 10, heal: 0, reduction: 0.4 }
  if (move === 'gambit') return { damage: Math.random() >= 0.5 ? 50 : 0, heal: 0, reduction: 0 }
  if (move === 'special') return { damage: 35, heal: 0, reduction: 0 }
  return { damage: Math.floor(Math.random() * 11) + 25, heal: 0, reduction: 0 }
}

async function geminiNarrative(payload: { fighterA: string; fighterB: string; moveA: string; moveB: string; dmgA: number; dmgB: number; roundNumber: number; duelOver: boolean; winner?: string | null }) {
  const fallback = payload.moveA === 'gambit' || payload.moveB === 'gambit'
    ? `${payload.fighterA} and ${payload.fighterB} turn the round on a reckless gamble, and the city records the sharper outcome without sentiment.`
    : payload.moveA === 'recover' || payload.moveB === 'recover'
      ? `${payload.fighterA} and ${payload.fighterB} break the rhythm of the duel as one side chooses recovery over pressure. The registry records which file leaves the exchange steadier.`
      : `${payload.fighterA} and ${payload.fighterB} force a direct exchange, and the registry records which side leaves the heavier mark in round ${payload.roundNumber}.`
  if (!geminiKey) {
    return { text: fallback, isFallback: true }
  }

  const prompt = `You are the Yokohama ability registry combat recorder.\nWrite exactly 2 sentences describing what happened in this round of combat.\nDo not mention HP numbers, damage values, or AP.\nPresent tense. Literary, cold, precise. Bungo Stray Dogs tone.\nNo preamble. Return ONLY the 2 sentences.\n\nFIGHTER A: ${payload.fighterA}\nFIGHTER B: ${payload.fighterB}\nFIGHTER A used: ${payload.moveA}\nFIGHTER B used: ${payload.moveB}\nFIGHTER A damage dealt: ${payload.dmgA}\nFIGHTER B damage dealt: ${payload.dmgB}\nSetting: Yokohama\n${payload.duelOver ? `The duel has ended. ${payload.winner ?? payload.fighterA} is victorious.` : ''}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
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

async function resolveSingleDuel(duelId: string) {
  const duelResponse = await fetch(`${supabaseUrl}/rest/v1/duels?id=eq.${duelId}&select=id,challenger_id,defender_id,challenger_character,defender_character,status,current_round,challenger_hp,defender_hp,challenger_max_hp,defender_max_hp,is_war_duel`, { headers })
  const [duel] = await duelResponse.json()

  if (!duel) {
    return
  }

  const roundResponse = await fetch(`${supabaseUrl}/rest/v1/duel_rounds?duel_id=eq.${duelId}&round_number=eq.${duel.current_round}&limit=1&select=*`, { headers })
  const [round] = await roundResponse.json()

  if (!duel || !round || duel.status !== 'active' || round.resolved_at) {
    return
  }

  const moveA = round.challenger_move ?? 'stance'
  const moveB = round.defender_move ?? 'stance'
  const a = damageForMove(moveA)
  const b = damageForMove(moveB)
  const incomingToA = Math.max(0, b.damage * (moveA === 'stance' ? 0.6 : 1))
  const incomingToB = Math.max(0, a.damage * (moveB === 'stance' ? 0.6 : 1))
  const nextA = Math.max(0, Math.min(duel.challenger_max_hp, duel.challenger_hp - Math.round(incomingToA) + a.heal))
  const nextB = Math.max(0, Math.min(duel.defender_max_hp, duel.defender_hp - Math.round(incomingToB) + b.heal))

  // Sudden death and extended rounds
  const MAX_NORMAL_ROUNDS = 7
  const SUDDEN_DEATH_ROUND = 8
  const isSuddenDeath = duel.current_round === SUDDEN_DEATH_ROUND

  // In sudden death: damage is multiplied x1.5, no reduction from stance
  const finalNextA = isSuddenDeath
    ? Math.max(0, duel.challenger_hp - Math.round(b.damage * 1.5))
    : nextA
  const finalNextB = isSuddenDeath
    ? Math.max(0, duel.defender_hp - Math.round(a.damage * 1.5))
    : nextB

  const duelOver =
    finalNextA <= 0 ||
    finalNextB <= 0 ||
    duel.current_round >= SUDDEN_DEATH_ROUND

  // Determine winner. In sudden death, if tied after round 8, use cumulative damage; challenger wins tie.
  let winnerId = null
  const loserId = null
  if (duelOver) {
    if (finalNextA === finalNextB && duel.current_round >= SUDDEN_DEATH_ROUND) {
      // Fetch cumulative damage from all rounds
      const dmgResponse = await fetch(
        `${supabaseUrl}/rest/v1/duel_rounds?duel_id=eq.${duelId}&select=challenger_damage_dealt,defender_damage_dealt`,
        { headers }
      )
      const dmgRounds = await dmgResponse.json()
      const totalChallengerDmg = dmgRounds.reduce((sum: number, r: any) => sum + (r.challenger_damage_dealt ?? 0), 0)
      const totalDefenderDmg = dmgRounds.reduce((sum: number, r: any) => sum + (r.defender_damage_dealt ?? 0), 0)
      winnerId = totalChallengerDmg >= totalDefenderDmg ? duel.challenger_id : duel.defender_id
    } else {
      winnerId = finalNextA === finalNextB ? null : finalNextA > finalNextB ? duel.challenger_id : duel.defender_id
    }
  }

  // After 7 normal rounds: if both alive, go to sudden death
  const goToSuddenDeath =
    !duelOver &&
    duel.current_round >= MAX_NORMAL_ROUNDS &&
    finalNextA > 0 &&
    finalNextB > 0
  const narrative = await geminiNarrative({
    fighterA: duel.challenger_character ?? 'Operative',
    fighterB: duel.defender_character ?? 'Operative',
    moveA,
    moveB,
    dmgA: a.damage,
    dmgB: b.damage,
    roundNumber: duel.current_round,
    duelOver,
    winner: winnerId ? (winnerId === duel.challenger_id ? duel.challenger_character : duel.defender_character) : null,
  })

  await fetch(`${supabaseUrl}/rest/v1/duel_rounds?id=eq.${round.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      challenger_move: moveA,
      defender_move: moveB,
      challenger_damage_dealt: a.damage,
      defender_damage_dealt: b.damage,
      challenger_hp_after: nextA,
      defender_hp_after: nextB,
      narrative: narrative.text,
      narrative_is_fallback: narrative.isFallback,
      resolved_at: new Date().toISOString(),
    }),
  })

  if (duelOver) {
    await fetch(`${supabaseUrl}/rest/v1/duels?id=eq.${duel.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        status: 'complete',
        winner_id: winnerId,
        loser_id: winnerId ? (winnerId === duel.challenger_id ? duel.defender_id : duel.challenger_id) : null,
        challenger_hp: finalNextA,
        defender_hp: finalNextB,
        completed_at: new Date().toISOString(),
      }),
    })

    await fetch(`${supabaseUrl}/functions/v1/resolve-duel-aftermath`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ duel_id: duel.id }),
    })
    return
  }

  const nextRoundNumber = goToSuddenDeath ? SUDDEN_DEATH_ROUND : duel.current_round + 1
  await fetch(`${supabaseUrl}/rest/v1/duels?id=eq.${duel.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      current_round: nextRoundNumber,
      challenger_hp: finalNextA,
      defender_hp: finalNextB,
    }),
  })

  // Create the next round; include is_sudden_death if the column exists.
  try {
    await fetch(`${supabaseUrl}/rest/v1/duel_rounds`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        duel_id: duel.id,
        round_number: nextRoundNumber,
        round_started_at: new Date().toISOString(),
        round_deadline: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        is_sudden_death: goToSuddenDeath || isSuddenDeath,
      }),
    })
  } catch (e) {
    // If the column doesn't exist, fall back to inserting without it
    await fetch(`${supabaseUrl}/rest/v1/duel_rounds`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        duel_id: duel.id,
        round_number: nextRoundNumber,
        round_started_at: new Date().toISOString(),
        round_deadline: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      }),
    })
  }
  // Trigger bot move instantly
  try {
    const vercelUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? ''
    const botDuelSecret = Deno.env.get('BOT_DUEL_SECRET') ?? ''
    if (vercelUrl && botDuelSecret) {
      fetch(`${vercelUrl}/api/bots/submit-duel-move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bot-duel-secret': botDuelSecret,
        },
        body: JSON.stringify({}),
      }).catch(() => null)
    }
  } catch {}
}

serve(async (req) => {
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase credentials.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  const body = await req.json().catch(() => ({}))

  if (body?.trigger === 'cron') {
    const roundsResponse = await fetch(`${supabaseUrl}/rest/v1/duel_rounds?select=id,duel_id,challenger_move,defender_move,round_deadline,resolved_at&resolved_at=is.null&round_deadline=lt.${encodeURIComponent(new Date().toISOString())}&limit=20`, { headers })
    const rounds = await roundsResponse.json()

    for (const round of rounds ?? []) {
      if (!round.challenger_move || !round.defender_move) {
        await fetch(`${supabaseUrl}/rest/v1/duel_rounds?id=eq.${round.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            challenger_move: round.challenger_move ?? 'stance',
            defender_move: round.defender_move ?? 'stance',
          }),
        })
      }
      await resolveSingleDuel(round.duel_id)
    }

    return new Response(JSON.stringify({ success: true, processed: (rounds ?? []).length }), { headers: { 'Content-Type': 'application/json' } })
  }

  if (!body?.duel_id) {
    return new Response(JSON.stringify({ error: 'Missing duel_id.' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  await resolveSingleDuel(body.duel_id)
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
})
