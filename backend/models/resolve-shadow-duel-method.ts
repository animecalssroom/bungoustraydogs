import { supabaseAdmin } from '@/backend/lib/supabase'
import { WarRedisModel } from './war-redis.model'
import { getStrikeAbilityOutcome } from '@/backend/lib/war-abilities'
import { FactionWarModel } from './faction-war.model'
import { getDistrictData } from '@/frontend/lib/data/districts.data'

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function getApproachBonus(approach: 'Frontal Assault' | 'Outmaneuver' | 'Ability Overload', classTag: string | null) {
  if (approach === 'Frontal Assault' && classTag === 'BRUTE') return 10
  if (approach === 'Outmaneuver' && classTag === 'INTEL') return 12
  if (approach === 'Ability Overload' && classTag === 'ANOMALY') return 15
  if (approach === 'Frontal Assault' && classTag === 'SUPPORT') return -4
  return 0
}

function getClassMatchBonus(attackerClass: string | null, defenderClass: string | null) {
  if (!attackerClass || !defenderClass) return 0
  if (attackerClass === 'ANOMALY' && defenderClass === 'BRUTE') return 8
  if (attackerClass === 'INTEL' && defenderClass === 'ANOMALY') return 7
  if (attackerClass === 'BRUTE' && defenderClass === 'SUPPORT') return 6
  if (attackerClass === 'SUPPORT' && defenderClass === 'INTEL') return 4
  return 0
}

function getStanceBonus(stance: string | null) {
  if (stance === 'counter') return 8
  if (stance === 'tactical') return 4
  return 0
}

/**
 * Yokohama Tactical War System: Refined Shadow Duel Resolution (Bilateral Guard Mode)
 */
export async function resolveShadowDuel(
  attackerId: string,
  defenderId: string,
  warId: string,
  approach: 'Frontal Assault' | 'Outmaneuver' | 'Ability Overload'
) {
  const war = await FactionWarModel.getById(warId)
  if (!war || war.status === 'complete') {
    throw new Error('Conflict signature not found or already resolved.')
  }

  const roster = await FactionWarModel.getWarRoster(warId)
  const rosterMap = new Map(roster.map((entry) => [entry.user_id, entry]))
  const attacker = rosterMap.get(attackerId)
  const defender = rosterMap.get(defenderId)

  if (!attacker || !defender) {
    throw new Error('One or more operatives are not deployed in this warzone.')
  }

  // 1. Basic Restrictions
  if (attacker.deployment_role !== 'vanguard') {
    throw new Error('Only deployed vanguard operatives can initiate a strike.')
  }

  if (!attacker.faction || !defender.faction || attacker.faction === defender.faction) {
    throw new Error('Target is not a hostile operative.')
  }

  if (attacker.is_recovering) {
    throw new Error('Your operative is still in recovery and cannot engage.')
  }

  if (defender.is_recovering) {
    throw new Error('That target has already been incapacitated.')
  }

  // 2. Guard Enforcement (Bilateral)
  const activeEnemyGuards = roster.filter(
    (entry) =>
      entry.faction === defender.faction &&
      entry.deployment_role === 'guard' &&
      !entry.is_recovering,
  )

  const districtId = war.stakes_detail?.district_id as string | undefined
  const hasRecon =
    attacker.faction === war.faction_b_id ||
    (districtId ? await WarRedisModel.isDistrictRevealed(districtId, attacker.faction) : false)

  const strikeAbility = getStrikeAbilityOutcome({
    attacker,
    defender,
    roster,
    hasRecon,
    approach,
  })

  if (activeEnemyGuards.length > 0 && defender.deployment_role !== 'guard' && !strikeAbility.bypassGuards) {
    throw new Error('Enemy guards are still holding the line. Clear deployed guards before hitting open operatives.')
  }

  if (strikeAbility.suppressedReason) {
    throw new Error(strikeAbility.suppressedReason)
  }

  // 3. Power Calculation
  const attackerPower =
    attacker.stat_power * 0.5 +
    attacker.stat_speed * 0.25 +
    attacker.stat_control * 0.25 +
    getApproachBonus(approach, attacker.class_tag) +
    getClassMatchBonus(attacker.class_tag, defender.class_tag) +
    strikeAbility.attackerPowerBonus

  const defenderPower =
    defender.stat_power * 0.42 +
    defender.stat_speed * 0.18 +
    defender.stat_control * 0.4 +
    getStanceBonus(defender.deployment_stance) +
    (defender.deployment_role === 'guard' ? 10 : 0) +
    strikeAbility.defenderPowerBonus

  // --- District Mechanics Integration ---
  let districtBonus = 0
  if (districtId) {
    const data = getDistrictData(districtId)
    if (data) {
      // Apply base defense bonus
      districtBonus += data.mechanic.defense_bonus
      
      // Apply special character bonuses
      if (data.mechanic.special) {
        for (const spec of data.mechanic.special) {
          if (spec.includes(defender.character_name || '') && spec.includes('defending')) {
            const match = spec.match(/(\d+)%/)
            if (match) districtBonus += (defenderPower * parseInt(match[1]) / 100)
          }
        }
      }
    }
  }

  const finalDefenderPower = defenderPower + districtBonus

  // --- Boss Active Modifier ---
  const bossModifier = war.boss_active ? 1.5 : 1.0

  const reconModifier = hasRecon ? 6 : -6
  const baseWinChance = attackerPower / Math.max(attackerPower + finalDefenderPower, 1)
  const winChance = clamp((baseWinChance + reconModifier / 100) * (1 / bossModifier), 0.15, 0.85)
  const attackerWins = Math.random() < winChance

  const winner = attackerWins ? attacker : defender
  const loser = attackerWins ? defender : attacker
  const recoveryHours = strikeAbility.loserRecoveryHours * bossModifier
  const recoveryUntil = new Date(Date.now() + recoveryHours * 60 * 60 * 1000).toISOString()

  // 4. Persistence & Redis Updates
  await Promise.all([
    supabaseAdmin
      .from('user_characters')
      .update({ recovery_until: recoveryUntil })
      .eq('user_id', loser.user_id)
      .eq('is_equipped', true),
    supabaseAdmin
      .from('profiles')
      .update({ recovery_until: recoveryUntil, recovery_status: 'defeated' })
      .eq('id', loser.user_id),
    WarRedisModel.setRecovery(loser.user_id),
  ])

  // Tug-of-War Integrity Swing
  const integrityDelta =
    winner.faction === war.faction_a_id
      ? -(5 + (attackerWins ? strikeAbility.integrityBonusOnWin : 0))
      : 5 + (!attackerWins ? strikeAbility.integrityBonusOnDefenseWin : 0)
  
  // Guard defeat has higher impact
  const guardDefeatBonus = (loser.deployment_role === 'guard' ? (winner.faction === war.faction_a_id ? -3 : 3) : 0)
  
  // Boss victory has massive impact (Yokohama Faction Leads)
  const bossSlugs = ['mori-ogai', 'fukuzawa-yukichi', 'fitzgerald', 'fukuchi-ouchi', 'fyodor-dostoevsky', 'nikolai-gogol', 'ango-sakaguchi', 'agatha-christie'];
  const isBossVictory = winner.character_slug && bossSlugs.includes(winner.character_slug);
  const bossVictoryBonus = war.boss_active && isBossVictory ? (winner.faction === war.faction_a_id ? -25 : 25) : 0

  const finalIntegrity = await WarRedisModel.updateIntegrity(warId, integrityDelta + guardDefeatBonus + bossVictoryBonus)

  await Promise.all([
    FactionWarModel.updatePoints(warId, winner.faction as string, 5),
    supabaseAdmin.from('war_contributions').insert({
      war_id: warId,
      user_id: winner.user_id,
      contribution_type: 'duel_win',
      points: 5,
      reference_id: null,
    }),
  ])

  // 5. Narrative & Logs
  const combatSteps = [
    { phase: 'ENGAGEMENT', text: `@${attacker.username} commits to ${approach.toUpperCase()} against the ${defender.faction?.toUpperCase()} line.` },
    { phase: 'CONFLICT', text: `${attacker.character_name ?? attacker.username} [${attacker.class_tag ?? 'UNKNOWN'}] clashes with ${defender.character_name ?? defender.username} [${defender.class_tag ?? 'UNKNOWN'}].` },
    {
      phase: 'CLIMAX',
      text: attackerWins
        ? `${winner.character_name ?? winner.username} breaks the ${loser.deployment_role === 'guard' ? 'GARRISON' : 'VANGUARD'} and drops ${loser.character_name ?? loser.username}.`
        : `${winner.character_name ?? winner.username} repulses the advance and forces ${loser.character_name ?? loser.username} out of the sector.`,
    },
    ...strikeAbility.notes.map((note, index) => ({
      phase: `ABILITY_${index + 1}`,
      text: note,
    })),
  ]

  const msg = `[COMBAT] @${attacker.username} engaged @${defender.username}. ${winner.faction?.toUpperCase()} won the clash. ${loser.character_name ?? loser.username} is down for ${recoveryHours}h. Sector Integrity: ${finalIntegrity}%`
  await WarRedisModel.pushTransmission(warId, msg, 'combat')

  // 6. Capture Detection
  let resolvedWinner: string | null = null
  if (finalIntegrity <= 0) {
    resolvedWinner = war.faction_a_id // Attacker Capture
  } else if (finalIntegrity >= 100) {
    resolvedWinner = war.faction_b_id // Defender Hold
  }

  if (resolvedWinner) {
    await FactionWarModel.resolveWar(warId, resolvedWinner)
  }

  return {
    success: attackerWins,
    winner: winner.character_name ?? winner.username,
    loser: loser.character_name ?? loser.username,
    message: msg,
    combatSteps,
    stats: {
      attackerPower: Math.round(attackerPower),
      defenderPower: Math.round(defenderPower),
      approachBonus: getApproachBonus(approach, attacker.class_tag),
    },
    integrity: finalIntegrity,
    warResolved: Boolean(resolvedWinner),
    resolvedWinner,
    districtId: districtId ?? null,
  }
}
