import { supabaseAdmin } from '@/backend/lib/supabase'
import type { FactionWar, WarStatus, WarStakesType } from '@/backend/types'
import { ChronicleModel } from './chronicle.model'
import { cache as reactCache } from 'react'
import { cache as appCache } from '@/backend/lib/cache'
import { invalidateNotificationsCache } from '@/backend/lib/notifications-cache'
import type { DefenceStance, WarzoneRole } from './war-redis.model'
import { getStrikeAbilityOutcome } from '@/backend/lib/war-abilities'
import { CharacterModel } from './character.model'

const WAR_SELECT = 'id, faction_a_id, faction_b_id, status, winner_id, starts_at, ends_at, day2_at, day3_at, faction_a_points, faction_b_points, boss_active, stakes, stakes_detail, war_message, resolved_at, created_at, updated_at, chronicle_id'

type TacticalParticipant = {
  user_id: string
  username: string
  faction: string | null
  rank: number
  profile_class: string | null
  profile_recovery_until: string | null
  character_id: string | null
  character_slug: string | null
  character_name: string | null
  class_tag: string | null
  stat_power: number
  stat_speed: number
  stat_control: number
  deployment_role: WarzoneRole
  deployment_stance: DefenceStance
  deployed_at: string
  is_recovering: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function isRecoveryActive(recoveryUntil: string | null | undefined) {
  return Boolean(recoveryUntil && new Date(recoveryUntil).getTime() > Date.now())
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

function getStanceBonus(stance: DefenceStance) {
  if (stance === 'counter') return 8
  if (stance === 'tactical') return 4
  return 0
}

export const FactionWarModel = {
  async clearWarRecoveryState(warId: string) {
    const roster = await this.getWarRoster(warId)
    const participantIds = Array.from(new Set(roster.map((entry) => entry.user_id).filter(Boolean)))

    if (participantIds.length === 0) {
      return 0
    }

    const { WarRedisModel } = await import('./war-redis.model')

    await Promise.all([
      supabaseAdmin
        .from('profiles')
        .update({ recovery_until: null, recovery_status: 'active' })
        .in('id', participantIds)
        .eq('recovery_status', 'defeated'),
      supabaseAdmin
        .from('user_characters')
        .update({ recovery_until: null })
        .eq('is_equipped', true)
        .in('user_id', participantIds),
      Promise.all(participantIds.map((userId) => WarRedisModel.clearRecovery(userId))),
    ])

    return participantIds.length
  },

  async notifyFaction(factionId: string, type: string, message: string, payload: any = {}) {
    const { data: members } = await supabaseAdmin.from('profiles').select('id').eq('faction', factionId)
    if (members && members.length > 0) {
      const notifications = members.map(m => ({
        user_id: m.id,
        type,
        message,
        payload
      }))
      await supabaseAdmin.from('notifications').insert(notifications)
      await Promise.all(
        members.map((member) =>
          invalidateNotificationsCache(member.id).catch((err) => {
            console.error('[notifications] invalidate error', err)
          }),
        ),
      )
    }
  },

  getActiveWar: reactCache(async (): Promise<FactionWar | null> => {
    const { data, error } = await supabaseAdmin
      .from('faction_wars')
      .select(WAR_SELECT)
      .neq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (error) {
      console.error('[FactionWarModel] Error fetching active war:', error)
      return null
    }

    return data as FactionWar | null
  }),

  async getActiveWars(): Promise<FactionWar[]> {
    return appCache.getOrSet('war:active:list', 3, async () => {
      const { data, error } = await supabaseAdmin
        .from('faction_wars')
        .select(WAR_SELECT)
        .neq('status', 'complete')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[FactionWarModel] Error fetching active wars:', error)
        return []
      }

      return (data ?? []) as FactionWar[]
    })
  },

  async getById(warId: string): Promise<FactionWar | null> {
    return appCache.getOrSet(`war:detail:${warId}`, 3, async () => {
      const { data, error } = await supabaseAdmin
        .from('faction_wars')
        .select(WAR_SELECT)
        .eq('id', warId)
        .maybeSingle()

      if (error) {
        console.error('[FactionWarModel] Error fetching war by id:', error)
        return null
      }

      return data as FactionWar | null
    })
  },

  async getWarRoster(warId: string): Promise<TacticalParticipant[]> {
    return appCache.getOrSet(`war:roster:${warId}`, 3, async () => {
      const { WarRedisModel } = await import('./war-redis.model')
      const userIds = await WarRedisModel.getWarzonePresence(warId)

      if (userIds.length === 0) {
        return []
      }

      const [profilesResult, charactersResult, deploymentMap] = await Promise.all([
        supabaseAdmin
          .from('profiles')
          .select('id, username, faction, rank, character_class, character_match_id, character_name, recovery_until')
          .in('id', userIds),
        supabaseAdmin
          .from('user_characters')
          .select('user_id, recovery_until, characters(id, slug, name, class_tag, stat_power, stat_speed, stat_control)')
          .eq('is_equipped', true)
          .in('user_id', userIds),
        WarRedisModel.getDeployments(warId, userIds),
      ])

      if (profilesResult.error) {
        throw profilesResult.error
      }

      if (charactersResult.error) {
        throw charactersResult.error
      }

      const profileMap = new Map((profilesResult.data ?? []).map((row: any) => [row.id, row]))
      const characterMap = new Map((charactersResult.data ?? []).map((row: any) => [row.user_id, row]))
      const fallbackSlugs = Array.from(
        new Set(
          ((profilesResult.data ?? []) as any[])
            .map((row) => row.character_match_id)
            .filter((slug): slug is string => Boolean(slug)),
        ),
      )
      const fallbackCharacters = await Promise.all(
        fallbackSlugs.map(async (slug) => [slug, await CharacterModel.getBySlug(slug)] as const),
      )
      const fallbackCharacterMap = new Map(fallbackCharacters)

      return userIds.reduce<TacticalParticipant[]>((acc, userId) => {
        const profile = profileMap.get(userId)
        const charRow = characterMap.get(userId)
        const deployment = deploymentMap[userId]
        const character = Array.isArray(charRow?.characters) ? charRow.characters[0] : charRow?.characters
        const fallbackCharacter = profile?.character_match_id
          ? fallbackCharacterMap.get(profile.character_match_id) ?? null
          : null

        if (!profile || !deployment || (!character && !fallbackCharacter && !profile.character_match_id)) {
          return acc
        }

        acc.push({
          user_id: userId,
          username: profile.username,
          faction: profile.faction,
          rank: profile.rank ?? 0,
          profile_class: profile.character_class ?? null,
          profile_recovery_until: profile.recovery_until ?? null,
          character_id: character?.id ?? fallbackCharacter?.id ?? null,
          character_slug: character?.slug ?? profile.character_match_id ?? null,
          character_name: character?.name ?? fallbackCharacter?.name ?? profile.character_name ?? null,
          class_tag: character?.class_tag ?? fallbackCharacter?.class_tag ?? profile.character_class ?? null,
          stat_power: character?.stat_power ?? fallbackCharacter?.stat_power ?? 50,
          stat_speed: character?.stat_speed ?? fallbackCharacter?.stat_intel ?? 50,
          stat_control: character?.stat_control ?? fallbackCharacter?.stat_control ?? 50,
          deployment_role: deployment.role,
          deployment_stance: deployment.stance,
          deployed_at: deployment.deployedAt,
          is_recovering: isRecoveryActive(charRow?.recovery_until ?? profile.recovery_until),
        })
        return acc
      }, [])
    })
  },

  async isFactionAtWar(factionId: string): Promise<boolean> {
    const { count, error } = await supabaseAdmin
      .from('faction_wars')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'complete')
      .or(`faction_a_id.eq.${factionId},faction_b_id.eq.${factionId}`)
    
    if (error) return false
    return (count ?? 0) > 0
  },

  async startWar(params: {
    factionA: string
    factionB: string
    initiatorId?: string
    stakes: WarStakesType
    stakesDetail: any
    warMessage: string
    startsAt?: string
  }) {
    const startsAt = params.startsAt || new Date().toISOString()

    // Enforcement: Single War per Faction
    const [aAtWar, bAtWar] = await Promise.all([
      this.isFactionAtWar(params.factionA),
      this.isFactionAtWar(params.factionB)
    ])

    if (aAtWar) throw new Error(`Strategic Violation: Your faction (${params.factionA.toUpperCase()}) is already engaged in an active conflict. Finish current operations before redeploying.`)
    if (bAtWar) throw new Error(`Tactical Clearance Denied: Target faction (${params.factionB.toUpperCase()}) is already focused on another front. Multi-front conflicts are restricted.`)

    const day2At = new Date(new Date(startsAt).getTime() + 24 * 60 * 60 * 1000).toISOString()
    const day3At = new Date(new Date(startsAt).getTime() + 48 * 60 * 60 * 1000).toISOString()
    const endsAt = new Date(new Date(startsAt).getTime() + 72 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabaseAdmin
      .from('faction_wars')
      .insert({
        faction_a_id: params.factionA,
        faction_b_id: params.factionB,
        stakes: params.stakes,
        stakes_detail: params.stakesDetail,
        war_message: params.warMessage,
        status: 'active',
        starts_at: startsAt,
        day2_at: day2At,
        day3_at: day3At,
        ends_at: endsAt
      })
      .select(WAR_SELECT)
      .single()
    
    if (error) throw error

    // Notify Ango/Chronicle
    await ChronicleModel.create({
      title: `War Declaration: ${params.factionA.toUpperCase()} vs ${params.factionB.toUpperCase()}`,
      title_jp: `${params.factionA}と${params.factionB}の抗争勃発`,
      content: params.warMessage,
      excerpt: `Conflict erupts between ${params.factionA} and ${params.factionB} over ${params.stakesDetail?.description || params.stakes}.`,
      category: 'war'
    })

    // Notify Factions
    const declMessage = `A territorial dispute has been filed between ${params.factionA.toUpperCase()} and ${params.factionB.toUpperCase()}. ${params.stakesDetail?.description || params.stakes} is contested.`
    await this.notifyFaction(params.factionA, 'war_start', declMessage, { war_id: data.id })
    await this.notifyFaction(params.factionB, 'war_start', declMessage, { war_id: data.id })

    if (params.initiatorId) {
      const activityDescription = `War declared against ${params.factionB.toUpperCase()} over ${params.stakesDetail?.description || params.stakes}.`
      const defenceDescription = `${params.factionA.toUpperCase()} has declared war over ${params.stakesDetail?.description || params.stakes}. Defensive mobilization required.`

      await supabaseAdmin.from('faction_activity').insert([
        {
          faction_id: params.factionA,
          event_type: 'war_declared',
          description: activityDescription,
          actor_id: params.initiatorId,
        },
        {
          faction_id: params.factionB,
          event_type: 'war_declared',
          description: defenceDescription,
          actor_id: params.initiatorId,
        },
      ])
    }

    const { WarRedisModel } = await import('./war-redis.model')
    await WarRedisModel.setIntegrity(data.id, 50)
    await WarRedisModel.pushTransmission(
      data.id,
      `[WAR_DECLARATION] ${params.factionA.toUpperCase()} has opened hostilities against ${params.factionB.toUpperCase()} over ${params.stakesDetail?.description || params.stakes}.`,
      'system',
    )

    return data as FactionWar
  },

  async transitionToDay(warId: string, day: 'day2' | 'day3') {
    const { data, error } = await supabaseAdmin
      .from('faction_wars')
      .update({ status: day as any })
      .eq('id', warId)
      .select(WAR_SELECT)
      .single()
    
    if (error) throw error

    // Notifications
    const transitMessage = day === 'day2' 
      ? 'TAG TEAM FIGHTS UNLOCKED — Escalation confirmed.'
      : 'BOSS FIGHT SCANNED — Hostile ability signature detected. Factions ready for climax.'
    
    await this.notifyFaction(data.faction_a_id, 'war_transition', transitMessage, { war_id: warId, day })
    await this.notifyFaction(data.faction_b_id, 'war_transition', transitMessage, { war_id: warId, day })

    return data as FactionWar
  },

  async activateBoss(warId: string) {
    const { data, error } = await supabaseAdmin
      .from('faction_wars')
      .update({ boss_active: true })
      .eq('id', warId)
      .select(WAR_SELECT)
      .single()
    
    if (error) throw error

    const msg = "A hostile ability signature has been detected. Designation: RESERVED. Victory here resolves the conflict."
    await this.notifyFaction(data.faction_a_id, 'boss_active', msg, { war_id: warId })
    await this.notifyFaction(data.faction_b_id, 'boss_active', msg, { war_id: warId })

    return data as FactionWar
  },

  async updatePoints(warId: string, factionId: string, points: number) {
    const { data: war } = await supabaseAdmin.from('faction_wars').select(WAR_SELECT).eq('id', warId).single()
    if (!war) return

    const updateData = war.faction_a_id === factionId 
      ? { faction_a_points: (war.faction_a_points || 0) + points }
      : { faction_b_points: (war.faction_b_points || 0) + points }

    await supabaseAdmin.from('faction_wars').update(updateData).eq('id', warId)
  },

  async resolveWar(warId: string, bossWinFaction?: string) {
    const { data: war } = await supabaseAdmin.from('faction_wars').select(WAR_SELECT).eq('id', warId).single()
    if (!war || war.status === 'complete') return

    let winnerId = bossWinFaction || null
    
    if (!winnerId) {
      if (war.faction_a_points > war.faction_b_points) {
        winnerId = war.faction_a_id
      } else if (war.faction_b_points > war.faction_a_points) {
        winnerId = war.faction_b_id
      } else {
        // Tie: defending faction wins. Assuming faction_b is defender/incumbent in some contexts, 
        // but for now let's just pick one or check stakes_detail.
        winnerId = war.faction_b_id 
      }
    }

    const { error } = await supabaseAdmin
      .from('faction_wars')
      .update({
        status: 'complete',
        winner_id: winnerId,
        resolved_at: new Date().toISOString()
      })
      .eq('id', warId)
    
    if (error) throw error

    // Reward Logic (using optimized RPC)
    const winnerMedal = {
      id: `war_winner_${warId.slice(0, 8)}`,
      name: 'Conflict Victor',
      description: `Emerged victorious in the conflict between ${war.faction_a_id.toUpperCase()} and ${war.faction_b_id.toUpperCase()}.`,
      icon: 'military_tech',
      awarded_at: new Date().toISOString()
    }

    const factions = [
      { 
        id: war.faction_a_id, 
        amount: war.faction_a_id === winnerId ? 100 : 20, 
        isWinner: war.faction_a_id === winnerId,
        medal: war.faction_a_id === winnerId ? winnerMedal : null
      },
      { 
        id: war.faction_b_id, 
        amount: war.faction_b_id === winnerId ? 100 : 20, 
        isWinner: war.faction_b_id === winnerId,
        medal: war.faction_b_id === winnerId ? winnerMedal : null
      }
    ]

    for (const f of factions) {
      await supabaseAdmin.rpc('reward_faction_members_v2', {
        p_faction_id: f.id,
        p_ap_amount: f.amount,
        p_war_id: warId,
        p_is_winner: f.isWinner,
        p_medal_details: f.medal ? JSON.stringify(f.medal) : null
      })
    }

    // Stakes Resolution: District Control
    if (war.stakes === 'district' && war.stakes_detail?.district_id && winnerId) {
      const { DistrictModel } = await import('./district.model')
      await DistrictModel.setOwner(war.stakes_detail.district_id, winnerId)
    }

    // Notifications
    const endMessage = `The conflict has reached its end. ${winnerId?.toUpperCase()} takes the stakes.`
    await this.notifyFaction(war.faction_a_id, 'war_end', endMessage, { war_id: warId, winner_id: winnerId })
    await this.notifyFaction(war.faction_b_id, 'war_end', endMessage, { war_id: warId, winner_id: winnerId })

    // Top contributor bonus & Medal
    const { data: topContributors } = await supabaseAdmin
      .rpc('get_war_top_contributors', { p_war_id: warId })
    
    if (topContributors) {
      for (const tc of topContributors) {
        const topMedal = {
          id: `war_hero_${warId.slice(0, 8)}`,
          name: 'Front-line Hero',
          description: `Recognized as a top contributor in the ${war.faction_a_id.toUpperCase()}/${war.faction_b_id.toUpperCase()} conflict.`,
          icon: 'stars',
          awarded_at: new Date().toISOString()
        }

        const { data: p } = await supabaseAdmin.from('profiles').select('ap_total, medals').eq('id', tc.user_id).single()
        if (p) {
          const currentMedals = p.medals || []
          await supabaseAdmin.from('profiles').update({ 
            ap_total: p.ap_total + 50,
            medals: [...currentMedals, topMedal]
          }).eq('id', tc.user_id)
        }
      }
    }

    // Final Chronicle Entry
    await ChronicleModel.create({
      title: `War Resolution: ${war.faction_a_id.toUpperCase()} vs ${war.faction_b_id.toUpperCase()}`,
      title_jp: `抗争終結: ${war.faction_a_id}対${war.faction_b_id}`,
      content: `The conflict has reached its end. ${winnerId?.toUpperCase()} emerges victorious from the struggle for ${war.stakes_detail?.description || war.stakes}. Final Score: ${war.faction_a_id.toUpperCase()} ${war.faction_a_points} - ${war.faction_b_id.toUpperCase()} ${war.faction_b_points}.`,
      excerpt: `Resolution of the conflict between ${war.faction_a_id} and ${war.faction_b_id}. ${winnerId} takes the stakes.`,
      category: 'war'
    })

    try {
      const { WarRedisModel } = await import('./war-redis.model')
      await this.clearWarRecoveryState(warId)
      const districtLabel = war.stakes_detail?.description || war.stakes
      await WarRedisModel.pushTransmission(
        warId,
        `[WAR_END] ${winnerId?.toUpperCase() ?? 'UNKNOWN'} secured ${districtLabel}. District control has been updated.`,
        'system',
      )
      await WarRedisModel.clearWarzone(warId)
    } catch (err) {
      console.error('[FactionWarModel] Failed to finalize warzone state:', err)
    }

    return winnerId
  },

  async stopWar(warId: string, reason: string = 'Command has ordered an immediate ceasefire. All hostilities are suspended.') {
    const war = await this.getById(warId)
    if (!war || war.status === 'complete') return false

    const ceasefireNote = `\n\n[CEASEFIRE ORDER] ${reason}`
    const { error } = await supabaseAdmin
      .from('faction_wars')
      .update({
        status: 'complete',
        winner_id: null,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        war_message: `${war.war_message ?? ''}${ceasefireNote}`.trim(),
      })
      .eq('id', warId)

    if (error) throw error

    try {
      const { WarRedisModel } = await import('./war-redis.model')
      await this.clearWarRecoveryState(warId)
      await WarRedisModel.pushTransmission(
        warId,
        `[CEASEFIRE] ${war.faction_a_id.toUpperCase()} and ${war.faction_b_id.toUpperCase()} have been stood down. ${reason}`,
        'system',
      )
      await WarRedisModel.clearWarzone(warId)
    } catch (err) {
      console.error('[FactionWarModel] Failed to clear warzone after stopWar:', err)
    }

    await this.notifyFaction(war.faction_a_id, 'war_ceasefire', reason, { war_id: warId })
    await this.notifyFaction(war.faction_b_id, 'war_ceasefire', reason, { war_id: warId })

    return true
  },

  async stopAllActiveWars(reason: string = 'Command has ordered an immediate ceasefire. All hostilities are suspended.') {
    const activeWars = await this.getActiveWars()
    if (activeWars.length === 0) {
      return { stopped: 0 }
    }

    for (const war of activeWars) {
      await this.stopWar(war.id, reason)
    }

    return { stopped: activeWars.length }
  },

  async retreat(warId: string, retreatingFactionId: string) {
    const { supabaseAdmin } = await import('@/backend/lib/supabase')
    const { data: war } = await supabaseAdmin.from('faction_wars').select(WAR_SELECT).eq('id', warId).single()
    if (!war || war.status === 'complete') return

    const winnerId = war.faction_a_id === retreatingFactionId ? war.faction_b_id : war.faction_a_id

    // Use the stored procedure for comprehensive retreat logic
    const { error } = await supabaseAdmin.rpc('retreat_from_war', {
      p_war_id: warId,
      p_retreating_faction: retreatingFactionId
    })

    if (error) throw error

    // Reward participating members (mostly losers get participations rewards, winners get full victory)
    await this.notifyFaction(retreatingFactionId, 'war_retreat', 'Tactical withdrawal initiated. We have yielded the field.', { war_id: warId })
    await this.notifyFaction(winnerId, 'war_victory_retreat', 'Enemy has yielded. Total victory secured.', { war_id: warId })
  },

  getTopContributorsDetailed: reactCache(async (warId: string, limit: number = 5) => {
    const { data, error } = await supabaseAdmin
      .from('war_contributions')
      .select(`
        user_id,
        points,
        profiles!inner (
          username,
          rank,
          faction,
          recovery_until
        )
      `)
      .eq('war_id', warId)
      .order('points', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[FactionWarModel] Error fetching detailed contributors:', error)
      return []
    }

    return (data as any[]).map(row => ({
      user_id: row.user_id,
      username: row.profiles.username,
      rank: row.profiles.rank,
      faction: row.profiles.faction,
      points: row.points,
      recovery_until: row.profiles.recovery_until
    }))
  }),

  async executeStrike(userId: string, districtId: string, mode: 'assault' | 'infiltrate' | 'support') {
    const { UserModel } = await import('./user.model')
    const { WarContributionModel } = await import('./war-contribution.model')
    
    // 1. Check profile and MIA status
    const profile = await UserModel.getById(userId)
    if (!profile) throw new Error('User not found')
    if (UserModel.isUserMIA(profile)) {
      return { 
        success: false, 
        error: 'MIA', 
        recoveryUntil: profile.recovery_until,
        message: 'You are currently MIA and cannot participate in operations.'
      }
    }

    // 2. Check for active war
    const activeWar = await this.getActiveWar()
    if (!activeWar) {
      return { success: false, error: 'NO_ACTIVE_WAR', message: 'No active conflict signatures detected in Yokohama.' }
    }
    
    if (activeWar.faction_a_id !== profile.faction && activeWar.faction_b_id !== profile.faction) {
      return { success: false, error: 'NOT_AT_WAR', message: 'Your faction is not currently engaged in a registered conflict.' }
    }

    // 3. Operational Logic
    const roll = Math.random() * 100
    let success = false
    let pointsAwarded = 0
    let apAwarded = 0
    let miaHours = 0

    if (mode === 'assault') {
      success = roll < 70
      pointsAwarded = 50
      apAwarded = 50
      miaHours = 24
    } else if (mode === 'infiltrate') {
      success = roll < 90
      pointsAwarded = 25
      apAwarded = 25
      miaHours = 6
    } else {
      success = true
      pointsAwarded = 10
      apAwarded = 10
      miaHours = 0
    }

    if (success) {
      // Award AP (Manual override of AP_VALUES.war_strike which is 0)
      await UserModel.addAp(userId, 'war_strike', apAwarded, {
        mode,
        district_id: districtId,
        war_id: activeWar.id
      })

      // Add War Contribution record
      await WarContributionModel.addContribution({
        warId: activeWar.id,
        userId: userId,
        type: 'strike',
        points: pointsAwarded,
        factionId: profile.faction as string
      })

      return { 
        success: true, 
        pointsAwarded, 
        apAwarded, 
        message: `OPERATION_SUCCESS: Transmitted ${pointsAwarded} tactical points to the ${profile.faction?.toUpperCase()} front.`
      }
    } else {
      // Failure - Set MIA status
      await UserModel.setUserMIA(userId, miaHours, 'mia')
      
      const recoveryUntil = new Date(Date.now() + miaHours * 60 * 60 * 1000).toISOString()
      
      return { 
        success: false, 
        error: 'STRIKE_FAILURE', 
        message: `Operation compromised. Hostile forces have intercepted your signature. You are MIA for ${miaHours}h.`,
        recoveryUntil
      }
    }
  },

  /**
   * Yokohama Tactical War System: Solidified Shadow Duel Resolution
   */
  async resolveShadowDuel(
    attackerId: string,
    defenderId: string,
    warId: string,
    approach: 'Frontal Assault' | 'Outmaneuver' | 'Ability Overload'
  ) {
    const { WarRedisModel } = await import('./war-redis.model')
    const war = await this.getById(warId)
    if (!war || war.status === 'complete') {
      throw new Error('Conflict signature not found or already resolved.')
    }

    const roster = await this.getWarRoster(warId)
    const rosterMap = new Map(roster.map((entry) => [entry.user_id, entry]))
    const attacker = rosterMap.get(attackerId)
    const defender = rosterMap.get(defenderId)

    if (!attacker || !defender) {
      throw new Error('One or more operatives are not deployed in this warzone.')
    }

    if (attacker.deployment_role !== 'vanguard') {
      throw new Error('Only deployed vanguard operatives can initiate a strike.')
    }

    if (attacker.faction !== war.faction_a_id && attacker.faction !== war.faction_b_id) {
      throw new Error('Attacker faction is not registered to this conflict.')
    }

    if (defender.faction !== war.faction_a_id && defender.faction !== war.faction_b_id) {
      throw new Error('Defender faction is not registered to this conflict.')
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

    const reconModifier = hasRecon ? 6 : -6
    const baseWinChance = attackerPower / Math.max(attackerPower + defenderPower, 1)
    const winChance = clamp(baseWinChance + reconModifier / 100, 0.18, 0.82)
    const attackerWins = Math.random() < winChance

    const winner = attackerWins ? attacker : defender
    const loser = attackerWins ? defender : attacker
    const recoveryHours = strikeAbility.loserRecoveryHours
    const recoveryUntil = new Date(Date.now() + recoveryHours * 60 * 60 * 1000).toISOString()

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

    const integrityDelta =
      winner.faction === war.faction_a_id
        ? -(5 + (attackerWins ? strikeAbility.integrityBonusOnWin : 0))
        : 5 + (!attackerWins ? strikeAbility.integrityBonusOnDefenseWin : 0)
    const finalIntegrity = await WarRedisModel.updateIntegrity(warId, integrityDelta)

    await Promise.all([
      this.updatePoints(warId, winner.faction as string, 5),
      supabaseAdmin.from('war_contributions').insert({
        war_id: warId,
        user_id: winner.user_id,
        contribution_type: 'duel_win',
        points: 5,
        reference_id: null,
      }),
    ])

    const combatSteps = [
      { phase: 'ENGAGEMENT', text: `@${attacker.username} commits to ${approach.toUpperCase()}.` },
      { phase: 'CONFLICT', text: `${attacker.character_name ?? attacker.username} [${attacker.class_tag ?? 'UNKNOWN'}] clashes with ${defender.character_name ?? defender.username} [${defender.class_tag ?? 'UNKNOWN'}].` },
      {
        phase: 'CLIMAX',
        text: attackerWins
          ? `${winner.character_name ?? winner.username} breaks the line and drops ${loser.character_name ?? loser.username}.`
          : `${winner.character_name ?? winner.username} repulses the advance and forces ${loser.character_name ?? loser.username} out of the sector.`,
      },
      ...strikeAbility.notes.map((note, index) => ({
        phase: `ABILITY_${index + 1}`,
        text: note,
      })),
    ]

    const msg = `[COMBAT] @${attacker.username} engaged @${defender.username}. ${winner.faction?.toUpperCase()} won the clash. ${loser.character_name ?? loser.username} is down for ${recoveryHours}h. Integrity: ${finalIntegrity}%`
    await WarRedisModel.pushTransmission(warId, msg, 'combat')

    const postBattleRoster = roster.map((entry) =>
      entry.user_id === loser.user_id ? { ...entry, is_recovering: true } : entry,
    )
    const activeAttackers = postBattleRoster.filter(
      (entry) => entry.faction === war.faction_a_id && !entry.is_recovering,
    ).length
    const activeDefenders = postBattleRoster.filter(
      (entry) => entry.faction === war.faction_b_id && !entry.is_recovering,
    ).length

    let resolvedWinner: string | null = null
    if (finalIntegrity <= 0) {
      resolvedWinner = war.faction_a_id
    } else if (finalIntegrity >= 100) {
      resolvedWinner = war.faction_b_id
    } else if (activeAttackers === 0 && activeDefenders > 0) {
      resolvedWinner = war.faction_b_id
    } else if (activeDefenders === 0 && activeAttackers > 0) {
      resolvedWinner = war.faction_a_id
    }

    if (resolvedWinner) {
      await this.resolveWar(warId, resolvedWinner)
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
  },

  /**
   * Periodically sync Redis live state to Supabase for permanence.
   */
  async syncWarState(warId: string) {
    const { WarRedisModel } = await import('./war-redis.model')
    const integrity = await WarRedisModel.getIntegrity(warId)

    await supabaseAdmin
      .from('faction_wars')
      .update({ integrity, updated_at: new Date().toISOString() })
      .eq('id', warId)
    
    return integrity;
  },

  /**
   * Periodically sync Redis live state to Supabase for permanence.
   */
  async syncRedisToSupabase() {
    const { data: activeWars, error } = await supabaseAdmin
      .from('faction_wars')
      .select('id')
      .neq('status', 'complete')
    
    if (error) throw error
    if (!activeWars || activeWars.length === 0) return { synced: 0 }

    const results = await Promise.all(activeWars.map(w => this.syncWarState(w.id)))

    return { synced: activeWars.length, results }
  }
}
