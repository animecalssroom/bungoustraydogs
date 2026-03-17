import { supabaseAdmin } from '@/backend/lib/supabase'
import type { FactionWar, WarStatus, WarStakesType } from '@/backend/types'
import { ChronicleModel } from './chronicle.model'
import { cache } from 'react'

const WAR_SELECT = 'id, faction_a_id, faction_b_id, status, winner_id, starts_at, ends_at, day2_at, day3_at, faction_a_points, faction_b_points, boss_active, stakes, stakes_detail, war_message, resolved_at, created_at, updated_at, chronicle_id'

export const FactionWarModel = {
  async notifyFaction(factionId: string, type: string, message: string, payload: any = {}) {
    const { supabaseAdmin } = await import('@/backend/lib/supabase')
    const { data: members } = await supabaseAdmin.from('profiles').select('id').eq('faction', factionId)
    if (members && members.length > 0) {
      const notifications = members.map(m => ({
        user_id: m.id,
        type,
        message,
        payload
      }))
      await supabaseAdmin.from('notifications').insert(notifications)
    }
  },

  getActiveWar: cache(async (): Promise<FactionWar | null> => {
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

    return winnerId
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

  getTopContributorsDetailed: cache(async (warId: string, limit: number = 5) => {
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
    const { supabaseAdmin } = await import('@/backend/lib/supabase')
    const { WarRedisModel } = await import('./war-redis.model')

    // 1. Fetch character data from the new schema
    const [{ data: attackerChar }, { data: defenderChar }] = await Promise.all([
      supabaseAdmin
        .from('user_characters')
        .select('*, characters(*)')
        .eq('user_id', attackerId)
        .eq('is_equipped', true)
        .maybeSingle(),
      supabaseAdmin
        .from('user_characters')
        .select('*, characters(*)')
        .eq('user_id', defenderId)
        .eq('is_equipped', true)
        .maybeSingle()
    ])

    if (!attackerChar?.characters || !defenderChar?.characters) {
      throw new Error('One or more operatives do not have an active character signature.')
    }

    const { data: defenderProfile } = await supabaseAdmin
      .from('profiles')
      .select('faction')
      .eq('id', defenderId)
      .single()
    
    const { data: attackerProfile } = await supabaseAdmin
      .from('profiles')
      .select('faction')
      .eq('id', attackerId)
      .single()

    const { data: war } = await supabaseAdmin
      .from('faction_wars')
      .select('faction_a_id, faction_b_id, status')
      .eq('id', warId)
      .single()

    if (!war || war.status === 'complete') {
      throw new Error('Conflict signature not found or already resolved.')
    }

    const enemyFaction = war.faction_a_id === attackerProfile?.faction ? war.faction_b_id : war.faction_a_id
    if (defenderProfile?.faction !== enemyFaction) {
      throw new Error(`Target is not a member of the opposing faction (${enemyFaction?.toUpperCase()}).`)
    }

    const attackerInfo = attackerChar.characters as any
    const defenderInfo = defenderChar.characters as any
    const attackerClass = attackerInfo.class_tag as string
    const defenderClass = defenderInfo.class_tag as string

    // 2. Resolve (Strategic Matrix)
    let winChance = 0.5 

    if (attackerClass === 'ANOMALY' && defenderClass === 'BRUTE') winChance += 0.4
    if (attackerClass === 'INTEL' && defenderClass === 'ANOMALY') winChance += 0.2
    if (attackerClass === 'BRUTE' && defenderClass === 'SUPPORT') winChance += 0.3
    if (attackerClass === 'SUPPORT' && defenderClass === 'INTEL') winChance += 0.1
    
    if (approach === 'Frontal Assault' && attackerClass === 'BRUTE') winChance += 0.15
    if (approach === 'Outmaneuver' && attackerClass === 'INTEL') winChance += 0.20
    if (approach === 'Ability Overload' && attackerClass === 'ANOMALY') winChance += 0.25

    const roll = Math.random()
    const attackerWins = roll < winChance

    // Generate Cinematic Combat Steps
    const combatSteps = [
      { phase: 'ENGAGEMENT', text: `[SIGNAL_ACQUIRED] @${attackerId.slice(0, 4)} initiates ${approach}.` },
      { phase: 'CONFLICT', text: `${attackerInfo.name} [${attackerClass}] vs ${defenderInfo.name} [${defenderClass}]` },
      { phase: 'CLIMAX', text: attackerWins ? `Success. ${attackerInfo.name} broke through the defense.` : `Failed. ${defenderInfo.name} repulsed the assault.` }
    ]

    // 3. Penalty Integration (Recovery State)
    const loserId = attackerWins ? defenderId : attackerId
    const loserName = attackerWins ? defenderInfo.name : attackerInfo.name
    const recoveryUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await supabaseAdmin
      .from('user_characters')
      .update({ recovery_until: recoveryUntil })
      .eq('user_id', loserId)
      .eq('is_equipped', true)

    // 4. Integrity & Feed Updates
    const integrityDelta = attackerWins ? -5 : 2 
    const finalIntegrity = await WarRedisModel.updateIntegrity(warId, integrityDelta)

    const resultLabel = attackerWins ? 'NEUTRALIZED' : 'REPULSED'
    const msg = `> [COMBAT] @${attackerId.slice(0, 4)} result: ${resultLabel}. ${loserName} incapacitated. Integrity: ${finalIntegrity}%`
    
    await WarRedisModel.pushTransmission(warId, msg, 'combat')

    return {
      success: attackerWins,
      winner: attackerWins ? attackerInfo.name : defenderInfo.name,
      loser: loserName,
      message: msg,
      combatSteps,
      stats: {
        attackerPower: Math.round(winChance * 100),
        defenderPower: Math.round((1 - winChance) * 100),
        approachBonus: (approach === 'Frontal Assault' && attackerClass === 'BRUTE') ? 15 : 
                        (approach === 'Outmaneuver' && attackerClass === 'INTEL') ? 20 :
                        (approach === 'Ability Overload' && attackerClass === 'ANOMALY') ? 25 : 0
      },
      integrity: finalIntegrity
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
