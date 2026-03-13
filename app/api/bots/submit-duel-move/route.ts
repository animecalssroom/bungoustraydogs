import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { chooseBotMove, type BotDuelStrategy } from '@/lib/duels/npc-logic'

const STRATEGY_BY_CHARACTER: Record<string, BotDuelStrategy> = {
  'kenji-miyazawa': 'PATIENT_DESTRUCTION',
  'gin-akutagawa': 'COUNTER_WAIT',
  'tachihara-michizou': 'GAMBIT_CHAOS',
  'mark-twain': 'GAMBIT_CHAOS',
  'louisa-may-alcott': 'CALCULATED_HEAL',
  'akiko-yosano': 'CALCULATED_HEAL',
  'edgar-allan-poe': 'TRAP_THEN_WAIT',
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-bot-secret')
  if (!process.env.BOT_DUEL_SECRET || secret !== process.env.BOT_DUEL_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: duels } = await supabaseAdmin
    .from('duels')
    .select('id, challenger_id, defender_id, challenger_character_slug, defender_character_slug, current_round, challenger_hp, defender_hp')
    .eq('status', 'active')
    .limit(20)

  const processed: string[] = []

  for (const duel of duels ?? []) {
    const { data: round } = await supabaseAdmin
      .from('duel_rounds')
      .select('id, challenger_move_submitted_at, defender_move_submitted_at')
      .eq('duel_id', duel.id)
      .eq('round_number', duel.current_round)
      .is('resolved_at', null)
      .maybeSingle()

    if (!round) continue

    const { data: challenger } = await supabaseAdmin
      .from('profiles')
      .select('id, is_bot')
      .eq('id', duel.challenger_id)
      .maybeSingle()

    const { data: defender } = await supabaseAdmin
      .from('profiles')
      .select('id, is_bot')
      .eq('id', duel.defender_id)
      .maybeSingle()

    const targets: Array<{ userId: string; hp: number; characterSlug: string | null }> = []
    if (challenger?.is_bot && !round.challenger_move_submitted_at) {
      targets.push({ userId: duel.challenger_id, hp: duel.challenger_hp, characterSlug: duel.challenger_character_slug })
    }
    if (defender?.is_bot && !round.defender_move_submitted_at) {
      targets.push({ userId: duel.defender_id, hp: duel.defender_hp, characterSlug: duel.defender_character_slug })
    }

    for (const target of targets) {
      const strategy: BotDuelStrategy =
        (target.characterSlug ? STRATEGY_BY_CHARACTER[target.characterSlug] : null) ??
        'PATIENT_DESTRUCTION'
      const move = chooseBotMove(strategy, duel.current_round, target.hp)
      await fetch(new URL('/api/duels/submit-move', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bot-secret': secret ?? '',
        },
        body: JSON.stringify({
          duel_id: duel.id,
          move,
          bot_user_id: target.userId,
        }),
      }).catch(() => null)

      processed.push(duel.id)
    }
  }

  return NextResponse.json({ success: true, processed })
}
