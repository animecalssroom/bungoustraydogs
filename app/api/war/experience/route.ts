import { NextRequest, NextResponse } from 'next/server'
import { requireUserId, isNextResponse } from '@/backend/middleware/auth'
import { WarRedisModel } from '@/backend/models/war-redis.model'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { FactionWarModel } from '@/backend/models/faction-war.model'
import { cache as appCache } from '@/backend/lib/cache'
import { UserModel } from '@/backend/models/user.model'
import { resolveWarOperative } from '@/backend/lib/war-operative'
import {
  canUseWarRecon,
  getWarAbilityProfile,
  getWarAbilitySummary,
  shouldRevealField,
} from '@/backend/lib/war-abilities'
import type { WarRevealField } from '@/backend/lib/war-abilities'

export async function GET(request: NextRequest) {
  const userId = await requireUserId(request)
  if (isNextResponse(userId)) return userId

  const { searchParams } = new URL(request.url)
  const warId = searchParams.get('warId')
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  if (!warId) {
    return NextResponse.json({ error: 'Missing warId.' }, { status: 400 })
  }

  if (!uuidPattern.test(warId)) {
    return NextResponse.json({ error: 'Invalid warId.' }, { status: 400 })
  }

  try {
    const districtId = searchParams.get('districtId')
    const feedOnly = !districtId
    const cacheKey = `war:experience:${warId}:${districtId ?? 'feed'}:${userId}`
    const buildPayload = async () => {
      const war = await FactionWarModel.getById(warId)

      if (!war || war.status === 'complete') {
        throw new Error('WAR_NOT_FOUND')
      }

      const [integrity, transmissions] = await Promise.all([
        WarRedisModel.getIntegrity(warId),
        WarRedisModel.getTransmissions(warId, 15),
      ])

      if (feedOnly) {
        return {
          integrity,
          transmissions,
          war,
        }
      }

      const viewerProfile = await UserModel.getById(userId)
      const userFaction = viewerProfile?.faction ?? null
      const roster = await FactionWarModel.getWarRoster(warId)

      const [deployment, activeDeploymentWarId, operative, reconData] = await Promise.all([
        WarRedisModel.getPlayerDeployment(userId, warId),
        WarRedisModel.isUserAlreadyDeployed(userId),
        resolveWarOperative(userId),
        districtId && userFaction ? WarRedisModel.getDistrictReconData(districtId, userFaction) : Promise.resolve(null),
      ])

      if (!deployment && activeDeploymentWarId === warId) {
        console.warn('[WAR_EXPERIENCE_API] deployment key missing despite active deployment lock', {
          userId,
          warId,
          districtId,
        })
      }

      const hasWarRecoveryContext =
        Boolean(deployment) ||
        activeDeploymentWarId === warId ||
        roster.some((entry) => entry.user_id === userId)

      const isRecovering = Boolean(
        hasWarRecoveryContext &&
        operative.recovery_until &&
        new Date(operative.recovery_until).getTime() > Date.now(),
      )

      const isRevealed = Boolean(reconData)
      const revealFields: WarRevealField[] = reconData?.revealFields?.length
        ? (reconData.revealFields as WarRevealField[])
        : ['character_name', 'class_tag', 'deployment_role']
      const enemyFaction =
        userFaction === war.faction_a_id ? war.faction_b_id :
        userFaction === war.faction_b_id ? war.faction_a_id :
        null

      const activeEnemyGuards = roster.filter(
        (entry) =>
          enemyFaction &&
          entry.faction === enemyFaction &&
          entry.deployment_role === 'guard' &&
          !entry.is_recovering,
      )

      const specialLocked = activeEnemyGuards.some((entry) =>
        (getWarAbilityProfile(entry.character_slug, entry.class_tag).guard?.suppressApproaches ?? []).includes('Ability Overload'),
      )

      const targetPool = activeEnemyGuards.length > 0
        ? activeEnemyGuards
        : roster.filter((entry) => enemyFaction && entry.faction === enemyFaction && !entry.is_recovering)

      const attackersNeedRecon = userFaction === war.faction_a_id

      const visibleRoster = roster.map((entry) => {
        const isEnemy = Boolean(userFaction && entry.faction !== userFaction)
        const isEncrypted = attackersNeedRecon && isEnemy && !isRevealed

        return {
          user_id: entry.user_id,
          username: shouldRevealField('username', isRevealed, revealFields, attackersNeedRecon) && !isEncrypted ? entry.username : null,
          faction: entry.faction,
          rank: shouldRevealField('rank', isRevealed, revealFields, attackersNeedRecon) && !isEncrypted ? entry.rank : null,
          character_name: shouldRevealField('character_name', isRevealed, revealFields, attackersNeedRecon) && !isEncrypted ? entry.character_name : null,
          class_tag: shouldRevealField('class_tag', isRevealed, revealFields, attackersNeedRecon) && !isEncrypted ? entry.class_tag : null,
          character_slug: shouldRevealField('character_name', isRevealed, revealFields, attackersNeedRecon) && !isEncrypted ? entry.character_slug : null,
          deployment_role: shouldRevealField('deployment_role', isRevealed, revealFields, attackersNeedRecon) && !isEncrypted ? entry.deployment_role : null,
          stance: shouldRevealField('stance', isRevealed, revealFields, attackersNeedRecon) && !isEncrypted ? entry.deployment_stance : null,
          is_recovering: entry.is_recovering,
          is_guard: entry.deployment_role === 'guard',
          isEncrypted,
        }
      })

      const visibleTargets = targetPool.map((entry) => {
        const isEncrypted = Boolean(attackersNeedRecon && userFaction && entry.faction !== userFaction && !isRevealed)
        return {
          user_id: entry.user_id,
          username: shouldRevealField('username', isRevealed, revealFields, attackersNeedRecon) && !isEncrypted ? entry.username : null,
          character_name: shouldRevealField('character_name', isRevealed, revealFields, attackersNeedRecon) && !isEncrypted ? entry.character_name : null,
          rank: shouldRevealField('rank', isRevealed, revealFields, attackersNeedRecon) && !isEncrypted ? entry.rank : null,
          faction: entry.faction,
          is_guard: entry.deployment_role === 'guard',
          isEncrypted,
        }
      })

      return {
        integrity,
        transmissions,
        deployment,
        isRecovering,
        isRevealed,
        class_tag: operative.class_tag || 'BRUTE',
        character_slug: operative.slug || null,
        userFaction,
        isParticipant: Boolean(userFaction && (userFaction === war.faction_a_id || userFaction === war.faction_b_id)),
        isAttacker: userFaction === war.faction_a_id,
        isDefender: userFaction === war.faction_b_id,
        canRecon: canUseWarRecon(operative.slug || null, operative.class_tag || null),
        abilitySummary: getWarAbilitySummary(operative.slug || null, operative.class_tag || null),
        specialLocked,
        specialLockedReason: specialLocked
          ? (isRevealed ? 'Enemy nullification guard detected in the sector.' : 'Area interference is disrupting special ability use.')
          : null,
        mustTargetGuards: activeEnemyGuards.length > 0,
        activeGuardCount: activeEnemyGuards.length,
        reconFields: revealFields,
        roster: visibleRoster,
        targets: visibleTargets,
        factionAId: war.faction_a_id,
        factionBId: war.faction_b_id,
        factionAPoints: war.faction_a_points || 0,
        factionBPoints: war.faction_b_points || 0,
      }
    }

    const payload = feedOnly
      ? await appCache.getOrSet(cacheKey, 5, buildPayload)
      : await buildPayload()

    return NextResponse.json(payload)
  } catch (error: any) {
    if (error instanceof Error && error.message === 'WAR_NOT_FOUND') {
      return NextResponse.json({ error: 'War not found.' }, { status: 404 })
    }
    console.error('[WAR_EXPERIENCE_API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch tactical data.' }, { status: 500 })
  }
}
