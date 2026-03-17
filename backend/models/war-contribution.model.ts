import { supabaseAdmin } from '@/backend/lib/supabase'
import type { WarContribution } from '@/backend/types'
import { FactionWarModel } from './faction-war.model'

const CONTRIBUTION_SELECT = 'id, user_id, war_id, contribution_type, points, reference_id, created_at'

export const WarContributionModel = {
  async addContribution(params: {
    warId: string
    userId: string
    type: 'duel_win' | 'registry_post' | 'daily_login' | 'team_fight' | 'boss_fight' | 'faction_raid' | 'strike'
    points: number
    referenceId?: string
    factionId?: string
  }) {
    // Check for daily limits if applicable
    if (params.type === 'registry_post') {
      const { count } = await supabaseAdmin
        .from('war_contributions')
        .select('id', { count: 'exact', head: true })
        .eq('war_id', params.warId)
        .eq('user_id', params.userId)
        .eq('contribution_type', 'registry_post')
      
      if ((count || 0) >= 2) return null // Limit reached
    }

    if (params.type === 'daily_login') {
      const today = new Date().toISOString().split('T')[0]
      const { data: existing } = await supabaseAdmin
        .from('war_contributions')
        .select('id')
        .eq('war_id', params.warId)
        .eq('user_id', params.userId)
        .eq('contribution_type', 'daily_login')
        .gte('created_at', `${today}T00:00:00Z`)
        .maybeSingle()
      
      if (existing) return null // Already earned today
    }

    const { data, error } = await supabaseAdmin
      .from('war_contributions')
      .insert({
        war_id: params.warId,
        user_id: params.userId,
        contribution_type: params.type,
        points: params.points,
        reference_id: params.referenceId || null
      })
      .select(CONTRIBUTION_SELECT)
      .single()
    
    if (error) throw error

    // Sync points back to FactionWar table
    let factionToUpdate = params.factionId
    if (!factionToUpdate) {
      const { data: user } = await supabaseAdmin.from('profiles').select('faction').eq('id', params.userId).single()
      factionToUpdate = user?.faction
    }
    
    if (factionToUpdate) {
      await FactionWarModel.updatePoints(params.warId, factionToUpdate, params.points)
    }

    return data as WarContribution
  }
}
