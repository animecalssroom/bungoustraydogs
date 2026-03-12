import { supabaseAdmin } from '@/backend/lib/supabase'
import { buildExamRetakeEligibleAtIso } from '@/backend/lib/exam-retake'
import type { VisibleFactionId, WaitlistEntry } from '@/backend/types'

function orderedWaitlistQuery(faction: VisibleFactionId) {
  return supabaseAdmin
    .from('waitlist')
    .select('id, user_id, faction, character_id, trait_scores, position, joined_at, notified_at')
    .eq('faction', faction)
    .order('position', { ascending: true, nullsFirst: false })
    .order('joined_at', { ascending: true })
    .limit(100)
}

export const WaitlistModel = {
  async getByUser(userId: string) {
    const { data } = await supabaseAdmin
      .from('waitlist')
      .select('id, user_id, faction, character_id, trait_scores, position, joined_at, notified_at')
      .eq('user_id', userId)
      .maybeSingle()

    return (data as WaitlistEntry | null) ?? null
  },

  async getNextPosition(faction: VisibleFactionId) {
    const { count } = await supabaseAdmin
      .from('waitlist')
      .select('id', { count: 'exact', head: true })
      .eq('faction', faction)

    return (count ?? 0) + 1
  },

  async rebalance(faction: VisibleFactionId) {
    const { data } = await orderedWaitlistQuery(faction)
    const rows = (data ?? []) as WaitlistEntry[]

    await Promise.all(
      rows.map((row, index) =>
        supabaseAdmin
          .from('waitlist')
          .update({ position: index + 1 })
          .eq('id', row.id),
      ),
    )
  },

  async enqueue(
    userId: string,
    faction: VisibleFactionId,
    characterId: string | null,
    traitScores: Record<string, number>,
  ) {
    const existing = await this.getByUser(userId)

    if (existing && existing.faction !== faction) {
      await supabaseAdmin.from('waitlist').delete().eq('user_id', userId)
      await this.rebalance(existing.faction)
    }

    const position = await this.getNextPosition(faction)

    await supabaseAdmin.from('waitlist').upsert(
      {
        user_id: userId,
        faction,
        character_id: characterId,
        trait_scores: traitScores,
        position,
        joined_at: existing?.joined_at ?? new Date().toISOString(),
        notified_at: null,
      },
      {
        onConflict: 'user_id',
      },
    )

    await this.rebalance(faction)
    return this.getByUser(userId)
  },

  async removeByUser(userId: string) {
    const existing = await this.getByUser(userId)

    if (!existing) {
      return null
    }

    await supabaseAdmin.from('waitlist').delete().eq('user_id', userId)
    await this.rebalance(existing.faction)
    return existing
  },

  async activateNext(faction: VisibleFactionId) {
    const { data: slot } = await supabaseAdmin
      .from('faction_slots')
      .select('active_count, max_slots')
      .eq('faction', faction)
      .maybeSingle()

    if (!slot || slot.active_count >= slot.max_slots) {
      return null
    }

    const { data } = await orderedWaitlistQuery(faction).limit(1).maybeSingle()
    const next = (data as WaitlistEntry | null) ?? null

    if (!next) {
      return null
    }

    await supabaseAdmin
      .from('profiles')
      .update({
        role: 'member',
        faction,
        character_name: null,
        character_match_id: null,
        character_ability: null,
        character_ability_jp: null,
        character_description: null,
        character_type: null,
        character_assigned_at: null,
        exam_completed: true,
        quiz_completed: true,
        quiz_locked: true,
        exam_retake_eligible_at: buildExamRetakeEligibleAtIso(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', next.user_id)

    await supabaseAdmin.from('waitlist').delete().eq('id', next.id)

    await supabaseAdmin
      .from('faction_slots')
      .update({
        active_count: slot.active_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('faction', faction)

    await this.rebalance(faction)
    return next
  },
}
