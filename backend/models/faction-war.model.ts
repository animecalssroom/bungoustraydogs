import { supabaseAdmin } from '@/backend/lib/supabase'
import type { FactionWar, WarStatus, WarStakesType } from '@/backend/types'
import { ChronicleModel } from './chronicle.model'

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

  async getActiveWar(): Promise<FactionWar | null> {
    const { data } = await supabaseAdmin
      .from('faction_wars')
      .select('*')
      .neq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    return data as FactionWar | null
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
      .select('*')
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
      .select('*')
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
      .select('*')
      .single()
    
    if (error) throw error

    const msg = "A hostile ability signature has been detected. Designation: RESERVED. Victory here resolves the conflict."
    await this.notifyFaction(data.faction_a_id, 'boss_active', msg, { war_id: warId })
    await this.notifyFaction(data.faction_b_id, 'boss_active', msg, { war_id: warId })

    return data as FactionWar
  },

  async updatePoints(warId: string, factionId: string, points: number) {
    const { data: war } = await supabaseAdmin.from('faction_wars').select('*').eq('id', warId).single()
    if (!war) return

    const updateData = war.faction_a_id === factionId 
      ? { faction_a_points: (war.faction_a_points || 0) + points }
      : { faction_b_points: (war.faction_b_points || 0) + points }

    await supabaseAdmin.from('faction_wars').update(updateData).eq('id', warId)
  },

  async resolveWar(warId: string, bossWinFaction?: string) {
    const { data: war } = await supabaseAdmin.from('faction_wars').select('*').eq('id', warId).single()
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
    const factions = [
      { id: war.faction_a_id, amount: war.faction_a_id === winnerId ? 100 : 20, isWinner: war.faction_a_id === winnerId },
      { id: war.faction_b_id, amount: war.faction_b_id === winnerId ? 100 : 20, isWinner: war.faction_b_id === winnerId }
    ]

    for (const f of factions) {
      await supabaseAdmin.rpc('reward_faction_members', {
        p_faction_id: f.id,
        p_ap_amount: f.amount,
        p_war_id: warId,
        p_is_winner: f.isWinner
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

    // Top contributor bonus
    const { data: topContributors } = await supabaseAdmin
      .rpc('get_war_top_contributors', { p_war_id: warId })
    
    if (topContributors) {
      for (const tc of topContributors) {
        const { data: p } = await supabaseAdmin.from('profiles').select('ap_total').eq('id', tc.user_id).single()
        if (p) {
          await supabaseAdmin.from('profiles').update({ ap_total: p.ap_total + 50 }).eq('id', tc.user_id)
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
  }
}
