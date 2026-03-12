import { supabaseAdmin } from '@/backend/lib/supabase'
import { buildExamRetakeEligibleAtIso } from '@/backend/lib/exam-retake'
import type { Profile, VisibleFactionId } from '@/backend/types'
import { VISIBLE_FACTIONS } from '@/frontend/lib/launch'
import { WaitlistModel } from '@/backend/models/waitlist.model'

type StoredExamStatus = 'clear' | 'tied' | 'unplaceable' | null

type StoredExamProfile = Pick<
  Profile,
  | 'faction'
  | 'quiz_completed'
  | 'quiz_locked'
  | 'role'
  | 'exam_retake_eligible_at'
  | 'exam_retake_used'
> & {
  exam_scores: Record<string, number> | null
  exam_status: StoredExamStatus
}

async function updateProfileForOutcome(
  userId: string,
  updates: Partial<Profile>,
) {
  await supabaseAdmin
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
}

async function getStoredExamProfile(userId: string) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select(
      'faction, quiz_completed, quiz_locked, role, exam_scores, exam_status, exam_retake_eligible_at, exam_retake_used',
    )
    .eq('id', userId)
    .single()

  return (data as StoredExamProfile | null) ?? null
}

async function adjustTrackedSlotCount(faction: string, delta: number) {
  const { data: slot } = await supabaseAdmin
    .from('faction_slots')
    .select('active_count')
    .eq('faction', faction)
    .maybeSingle()

  if (!slot) {
    return
  }

  await supabaseAdmin
    .from('faction_slots')
    .update({
      active_count: Math.max(0, (slot.active_count ?? 0) + delta),
      updated_at: new Date().toISOString(),
    })
    .eq('faction', faction)
}

async function clearExistingOutcome(
  userId: string,
  profile: Pick<Profile, 'role' | 'faction'>,
) {
  if ((profile.role === 'member' || profile.role === 'mod') && profile.faction) {
    await adjustTrackedSlotCount(profile.faction, -1)
  }

  await WaitlistModel.removeByUser(userId)
  await supabaseAdmin.from('observer_pool').delete().eq('user_id', userId)
}

export const OnboardingModel = {
  async factionHasSpace(faction: VisibleFactionId) {
    const { data, error } = await supabaseAdmin.rpc('faction_has_space', {
      p_faction: faction,
    })

    if (!error && typeof data === 'boolean') {
      return data
    }

    const { data: row } = await supabaseAdmin
      .from('faction_slots')
      .select('active_count, max_slots')
      .eq('faction', faction)
      .single()

    if (!row) {
      return false
    }

    return row.active_count < row.max_slots
  },

  async accept(userId: string) {
    const examProfile = await getStoredExamProfile(userId)

    if (!examProfile?.quiz_completed) {
      return null
    }

    await clearExistingOutcome(userId, examProfile)

    const resolutionScores = examProfile.exam_scores ?? {}
    const storedFaction = examProfile.faction as VisibleFactionId | null

    if (examProfile.exam_status === 'unplaceable' || !storedFaction) {
      await updateProfileForOutcome(userId, {
        role: 'observer',
        faction: null,
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
      })

      return {
        outcome: 'observer' as const,
        faction: null,
        characterId: null,
        waitlistPosition: null,
        resolution: {
          faction: null,
          status: 'unplaceable' as const,
          scores: resolutionScores,
        },
      }
    }

    const hasSpace = await this.factionHasSpace(storedFaction)

    if (hasSpace) {
      await updateProfileForOutcome(userId, {
        role: 'member',
        faction: storedFaction,
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
        exam_retake_eligible_at:
          examProfile.exam_retake_eligible_at ?? buildExamRetakeEligibleAtIso(),
      })
      await adjustTrackedSlotCount(storedFaction, 1)

      return {
        outcome: 'member' as const,
        faction: storedFaction,
        characterId: null,
        waitlistPosition: null,
        resolution: {
          faction: storedFaction,
          status: examProfile.exam_status ?? 'clear',
          scores: resolutionScores,
        },
      }
    }

    await updateProfileForOutcome(userId, {
      role: 'waitlist',
      faction: storedFaction,
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
      })

    const entry = await WaitlistModel.enqueue(
      userId,
      storedFaction,
      null,
      resolutionScores,
    )

    return {
      outcome: 'waitlist' as const,
      faction: storedFaction,
      characterId: null,
      waitlistPosition: entry?.position ?? null,
      resolution: {
        faction: storedFaction,
        status: examProfile.exam_status ?? 'clear',
        scores: resolutionScores,
      },
    }
  },

  async getFactionCounts() {
    const { data } = await supabaseAdmin
      .from('faction_slots')
      .select('*')
      .in('faction', VISIBLE_FACTIONS)

    return data ?? []
  },
}
