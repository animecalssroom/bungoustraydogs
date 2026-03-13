import type { DuelMove, DuelRound } from '@/backend/types'

export const MOVE_LABELS: Record<DuelMove, string> = {
  strike: 'Strike',
  stance: 'Stance',
  gambit: 'Gambit',
  special: 'Special',
  recover: 'Recover',
}

export function formatMoveLabel(move: DuelMove | null | undefined) {
  return move ? MOVE_LABELS[move] : '?'
}

function moveSentence(actor: string, opponent: string, move: DuelMove, damage: number) {
  switch (move) {
    case 'gambit':
      return damage >= 50
        ? `${actor} commits fully to a gambit and catches ${opponent} before the exchange can settle.`
        : `${actor} bets the round on a gambit, but the opening collapses before the blow can land.`
    case 'stance':
      return `${actor} settles into stance, narrowing the angle and forcing the round into a slower, guarded shape.`
    case 'recover':
      return `${actor} gives up immediate pressure to recover and steady their breathing.`
    case 'special':
      return `${actor} tears into the round with their ability signature and breaks the usual rhythm of the duel.`
    default:
      return `${actor} presses forward with a direct strike and forces ${opponent} to answer on the spot.`
  }
}

function clashSentence(
  moveA: DuelMove,
  moveB: DuelMove,
  challengerName: string,
  defenderName: string,
  damageA: number,
  damageB: number,
) {
  if (moveA === 'gambit' && moveB === 'strike') {
    return damageA > 0
      ? `${challengerName}'s gamble lands before ${defenderName}'s cleaner attack can fully take hold.`
      : `${defenderName} punishes the failed gamble with a cleaner line of force.`
  }

  if (moveA === 'strike' && moveB === 'gambit') {
    return damageB > 0
      ? `${defenderName}'s gamble slips past the direct approach and swings the exchange sharply.`
      : `${challengerName} keeps the round disciplined and denies the gamble room to bloom.`
  }

  if (moveA === 'stance' && moveB === 'strike') {
    return `${challengerName} absorbs part of the direct pressure behind a guarded stance while ${defenderName} keeps forcing the pace.`
  }

  if (moveA === 'strike' && moveB === 'stance') {
    return `${defenderName} blunts the direct hit behind stance, but ${challengerName} still keeps the pressure on.`
  }

  if (moveA === 'recover' || moveB === 'recover') {
    return `The rhythm of the round breaks as one file chooses recovery over immediate pressure.`
  }

  if (moveA === 'gambit' && moveB === 'gambit') {
    return `Both files overcommit at once, and the round turns on whether either gamble actually connects.`
  }

  if (moveA === 'stance' && moveB === 'stance') {
    return `Neither side fully opens the round, and the exchange settles into patience rather than a clean rush.`
  }

  if (moveA === 'special' || moveB === 'special') {
    return `The duel briefly slips out of ordinary rhythm as an ability signature enters the exchange.`
  }

  return `Neither file yields the initiative easily, and the round resolves through direct pressure on both sides.`
}

function impactSentence(challengerName: string, defenderName: string, damageA: number, damageB: number) {
  if (damageA === damageB) {
    return `The registry records neither file breaking the other cleanly in this exchange.`
  }

  if (damageA > damageB) {
    return `${challengerName} leaves the heavier mark on the round, and ${defenderName} gives ground under that pressure.`
  }

  return `${defenderName} controls the harsher exchange, and ${challengerName} absorbs the worse of it.`
}

export function buildFallbackRoundNarrative(input: {
  challengerName: string
  defenderName: string
  moveA: DuelMove
  moveB: DuelMove
  damageA: number
  damageB: number
}) {
  const first = moveSentence(input.challengerName, input.defenderName, input.moveA, input.damageA)
  const second = moveSentence(input.defenderName, input.challengerName, input.moveB, input.damageB)
  const clash = clashSentence(
    input.moveA,
    input.moveB,
    input.challengerName,
    input.defenderName,
    input.damageA,
    input.damageB,
  )
  const impact = impactSentence(input.challengerName, input.defenderName, input.damageA, input.damageB)
  return `${first} ${second} ${clash} ${impact}`
}

function explainMoveResult(actor: string, move: DuelMove | null | undefined, damage: number, hpAfter: number | null | undefined) {
  if (!move) {
    return `${actor}: no recorded move.`
  }

  if (move === 'gambit') {
    return damage >= 50
      ? `${actor}: Gambit landed cleanly for a full swing.`
      : `${actor}: Gambit failed to connect and produced no real damage.`
  }

  if (move === 'recover') {
    return `${actor}: chose Recover, attempting to restore 20 HP while giving up direct pressure${hpAfter != null ? ` and closing the round at ${hpAfter} HP` : ''}.`
  }

  if (move === 'stance') {
    return `${actor}: chose Stance, trading lower damage for protection and damage reduction.`
  }

  if (move === 'special') {
    return `${actor}: used Special and forced the round through their ability profile.`
  }

  return `${actor}: chose Strike and pushed a direct line of pressure.`
}

function explainNetEffect(actor: string, move: DuelMove | null | undefined, damage: number, hpAfter: number | null | undefined) {
  if (hpAfter == null || !move) {
    return null
  }

  if (move === 'recover') {
    return `${actor}: Recover triggered its 20 HP restoration before the round closed.`
  }

  if (move === 'gambit') {
    return damage >= 50
      ? `${actor}: Gambit paid out at full force.`
      : `${actor}: Gambit whiffed and dealt no damage.`
  }

  return null
}

function explainRoundSwing(
  challengerName: string,
  defenderName: string,
  challengerMove: DuelMove | null | undefined,
  defenderMove: DuelMove | null | undefined,
  damageA: number,
  damageB: number,
) {
  if (!challengerMove || !defenderMove) {
    return 'The round file is incomplete.'
  }

  return clashSentence(challengerMove, defenderMove, challengerName, defenderName, damageA, damageB)
}


export function getDisplayRoundNarrative(
  round: Pick<DuelRound, 'challenger_move' | 'defender_move' | 'challenger_damage_dealt' | 'defender_damage_dealt' | 'narrative' | 'narrative_is_fallback'>,
  challengerName: string,
  defenderName: string,
) {
  if (round.narrative && !round.narrative_is_fallback && !/exchanged blows/i.test(round.narrative)) {
    return round.narrative
  }

  return buildFallbackRoundNarrative({
    challengerName,
    defenderName,
    moveA: round.challenger_move ?? 'strike',
    moveB: round.defender_move ?? 'strike',
    damageA: round.challenger_damage_dealt ?? 0,
    damageB: round.defender_damage_dealt ?? 0,
  })
}

export function describeRoundMechanics(round: DuelRound, challengerName: string, defenderName: string) {
  const challengerMove = round.challenger_move
  const defenderMove = round.defender_move
  const challengerDamage = round.challenger_damage_dealt ?? 0
  const defenderDamage = round.defender_damage_dealt ?? 0

  return [
    explainMoveResult(challengerName, challengerMove, challengerDamage, round.challenger_hp_after),
    explainMoveResult(defenderName, defenderMove, defenderDamage, round.defender_hp_after),
    explainRoundSwing(challengerName, defenderName, challengerMove, defenderMove, challengerDamage, defenderDamage),
    explainNetEffect(challengerName, challengerMove, challengerDamage, round.challenger_hp_after),
    explainNetEffect(defenderName, defenderMove, defenderDamage, round.defender_hp_after),
    `${challengerName} dealt ${challengerDamage}. ${defenderName} dealt ${defenderDamage}.`,
    round.challenger_hp_after != null && round.defender_hp_after != null
      ? `HP after round: ${challengerName} ${round.challenger_hp_after} / ${defenderName} ${round.defender_hp_after}`
      : null,
  ].filter(Boolean) as string[]
}
