import { supabaseAdmin } from '@/backend/lib/supabase'
import { buildExamRetakeEligibleAtIso } from '@/backend/lib/exam-retake'
import { FACTION_META, VISIBLE_FACTIONS, getCharacterReveal } from '@/frontend/lib/launch'
import { getAbilityTypeForCharacter } from '@/frontend/lib/ability-types'
import type {
  AssignmentFlag,
  FactionId,
  Profile,
  UserEvent,
  VisibleFactionId,
} from '@/backend/types'
import { WaitlistModel } from '@/backend/models/waitlist.model'
import {
  SpecialDivisionModel,
  type SpecialDivisionRecommendation,
} from '@/backend/models/special-division.model'
import {
  SupportModel,
  type ContentFlagQueueItem,
  type TicketQueueItem,
} from '@/backend/models/support.model'

export interface OwnerDashboardUser {
  id: string
  username: string
  role: Profile['role']
  faction: FactionId | null
  character_match_id: string | null
  rank: number
  ap_total: number
  quiz_completed: boolean
  assignment_flag_used: boolean
  created_at: string
}

export interface OwnerDashboardFlag {
  id: string
  user_id: string
  username: string
  current_faction: FactionId | null
  requested_faction: FactionId | null
  status: AssignmentFlag['status']
  notes: string | null
  created_at: string
}

export interface OwnerDashboardSlot {
  faction: VisibleFactionId
  name: string
  active_count: number
  max_slots: number
  waitlist_count: number
}

export interface OwnerDashboardEvent {
  id: string
  username: string
  event_type: string
  faction: FactionId | null
  ap_awarded: number
  created_at: string
}

export interface OwnerReservedCharacter {
  slug: string
  character_name: string
  faction: FactionId
  reserved_reason: string | null
  assigned_to: string | null
  assigned_at: string | null
  assigned_username: string | null
  assigned_role: Profile['role'] | null
  assigned_faction: FactionId | null
}

export interface OwnerSpecialDivisionRecommendation
  extends SpecialDivisionRecommendation {}

export interface OwnerSupportTicket extends TicketQueueItem {}

export interface OwnerContentFlag extends ContentFlagQueueItem {}

async function createNotification(
  userId: string,
  type: string,
  message: string,
  payload: Record<string, unknown> = {},
) {
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type,
    message,
    payload,
  })
}

async function getFlagUserMap(flags: AssignmentFlag[]) {
  const ids = Array.from(new Set(flags.map((flag) => flag.user_id)))

  if (ids.length === 0) {
    return {} as Record<string, Pick<Profile, 'id' | 'username' | 'faction'>>
  }

  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, username, faction')
    .in('id', ids)

  return (data ?? []).reduce<Record<string, Pick<Profile, 'id' | 'username' | 'faction'>>>(
    (map, row) => {
      map[row.id] = row
      return map
    },
    {},
  )
}

async function adjustSlotCount(faction: string, delta: number) {
  const { data } = await supabaseAdmin
    .from('faction_slots')
    .select('active_count')
    .eq('faction', faction)
    .maybeSingle()

  if (!data) {
    return
  }

  const next = Math.max(0, (data.active_count ?? 0) + delta)

  await supabaseAdmin
    .from('faction_slots')
    .update({
      active_count: next,
      updated_at: new Date().toISOString(),
    })
    .eq('faction', faction)
}

async function hasTrackedSlotCapacity(faction: string) {
  const { data } = await supabaseAdmin
    .from('faction_slots')
    .select('active_count, max_slots')
    .eq('faction', faction)
    .maybeSingle()

  if (!data) {
    return true
  }

  return data.active_count < data.max_slots
}

async function getReservedCharacterStatuses() {
  const { data } = await supabaseAdmin
    .from('reserved_characters')
    .select('*')
    .order('character_name', { ascending: true })

  const rows =
    (data as Array<{
      slug: string
      character_name: string
      faction: FactionId
      reserved_reason: string | null
      assigned_to: string | null
      assigned_at: string | null
    }> | null) ?? []

  const assignedIds = rows
    .map((row) => row.assigned_to)
    .filter((value): value is string => Boolean(value))

  const { data: assignedProfiles } = assignedIds.length
    ? await supabaseAdmin
        .from('profiles')
        .select('id, username, role, faction')
        .in('id', assignedIds)
    : { data: [] as Array<Pick<Profile, 'id' | 'username' | 'role' | 'faction'>> }

  const assignedProfileMap = (assignedProfiles ?? []).reduce<
    Record<string, Pick<Profile, 'id' | 'username' | 'role' | 'faction'>>
  >((map, row) => {
    map[row.id] = row
    return map
  }, {})

  return rows.map<OwnerReservedCharacter>((row) => ({
    ...row,
    assigned_username: row.assigned_to
      ? assignedProfileMap[row.assigned_to]?.username ?? null
      : null,
    assigned_role: row.assigned_to
      ? assignedProfileMap[row.assigned_to]?.role ?? null
      : null,
    assigned_faction: row.assigned_to
      ? assignedProfileMap[row.assigned_to]?.faction ?? null
      : null,
  }))
}

export const OwnerModel = {
  async getDashboard() {
    const [
      profilesResult,
      flagsResult,
      slotsResult,
      waitlistResult,
      eventsResult,
      reservedCharacters,
      supportTickets,
      contentFlags,
    ] =
      await Promise.all([
        supabaseAdmin
          .from('profiles')
          .select('id, username, role, faction, character_match_id, rank, ap_total, quiz_completed, assignment_flag_used, created_at')
          .order('created_at', { ascending: false })
          .limit(150),
        supabaseAdmin
          .from('assignment_flags')
          .select('id, user_id, requested_faction, status, notes, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(100),
        supabaseAdmin
          .from('faction_slots')
          .select('faction, active_count, max_slots')
          .in('faction', VISIBLE_FACTIONS),
        supabaseAdmin.from('waitlist').select('faction'),
        supabaseAdmin
          .from('user_events')
          .select('id, user_id, event_type, faction, ap_awarded, created_at')
          .order('created_at', { ascending: false })
          .limit(20),
        getReservedCharacterStatuses(),
        SupportModel.getQueueTickets(),
        SupportModel.getQueueFlags(),
      ])

    const flags = (flagsResult.data ?? []) as AssignmentFlag[]
    const flagUsers = await getFlagUserMap(flags)

    const eventUserIds = Array.from(
      new Set((eventsResult.data ?? []).map((event) => event.user_id)),
    )

    const { data: eventUsers } = eventUserIds.length
      ? await supabaseAdmin
          .from('profiles')
          .select('id, username')
          .in('id', eventUserIds)
      : { data: [] as Array<{ id: string; username: string }> }

    const eventUserMap = (eventUsers ?? []).reduce<Record<string, string>>((map, row) => {
      map[row.id] = row.username
      return map
    }, {})

    const waitlistCounts = (waitlistResult.data ?? []).reduce<Record<string, number>>(
      (counts, row) => {
        counts[row.faction] = (counts[row.faction] ?? 0) + 1
        return counts
      },
      {},
    )

    const specialDivisionRecommendations =
      await SpecialDivisionModel.getOwnerRecommendations()

    return {
      users: (profilesResult.data ?? []) as OwnerDashboardUser[],
      flags: flags.map<OwnerDashboardFlag>((flag) => ({
        id: flag.id,
        user_id: flag.user_id,
        username: flagUsers[flag.user_id]?.username ?? 'Unknown User',
        current_faction: flagUsers[flag.user_id]?.faction ?? null,
        requested_faction: flag.requested_faction,
        status: flag.status,
        notes: flag.notes ?? null,
        created_at: flag.created_at,
      })),
      slots: ((slotsResult.data ?? []) as Array<{
        faction: VisibleFactionId
        active_count: number
        max_slots: number
      }>).map((slot) => ({
        faction: slot.faction,
        name: FACTION_META[slot.faction].name,
        active_count: slot.active_count,
        max_slots: slot.max_slots,
        waitlist_count: waitlistCounts[slot.faction] ?? 0,
      })),
      events: ((eventsResult.data ?? []) as UserEvent[]).map<OwnerDashboardEvent>((event) => ({
        id: event.id,
        username: eventUserMap[event.user_id] ?? 'Unknown User',
        event_type: event.event_type,
        faction: event.faction,
        ap_awarded: event.ap_awarded,
        created_at: event.created_at,
      })),
      reservedCharacters,
      specialDivisionRecommendations,
      supportTickets,
      contentFlags,
    }
  },

  async getReservedAssignmentData() {
    const [users, reservedCharacters] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select(
          'id, username, role, faction, character_match_id, rank, ap_total, quiz_completed, assignment_flag_used, created_at',
        )
        .order('username', { ascending: true }),
      getReservedCharacterStatuses(),
    ])

    return {
      users: (users.data ?? []) as OwnerDashboardUser[],
      reservedCharacters,
    }
  },

  async activateNextWaitlist(faction: VisibleFactionId) {
    const activated = await WaitlistModel.activateNext(faction)

    if (!activated) {
      return null
    }

    await createNotification(
      activated.user_id,
      'waitlist_activated',
      `A vacancy has opened. Your ${FACTION_META[faction].name} access is now active.`,
      {
        faction,
      },
    )

    return activated
  },

  async deleteUserCompletely(userId: string) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .eq('id', userId)
      .maybeSingle()

    const target = profile ?? { id: userId, username: 'Unknown User' }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      throw new Error(error.message)
    }

    return target
  },

  async resolveAssignmentFlag(
    flagId: string,
    action: 'confirm' | 'reassign',
    nextFaction?: VisibleFactionId,
  ) {
    const { data: flag } = await supabaseAdmin
      .from('assignment_flags')
      .select('id, user_id, requested_faction, status, notes, created_at')
      .eq('id', flagId)
      .maybeSingle()

    const record = (flag as AssignmentFlag | null) ?? null

    if (!record) {
      return null
    }

    if (record.status !== 'pending') {
      return record
    }

    if (action === 'confirm') {
      await supabaseAdmin
        .from('assignment_flags')
        .update({
          status: 'confirmed',
          notes: record.notes ?? 'Owner confirmed the current assignment.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', flagId)

      await createNotification(
        record.user_id,
        'assignment_flag_confirmed',
        'Observation complete. The city confirms your current assignment.',
        {},
      )

      return {
        ...record,
        status: 'confirmed' as const,
      }
    }

    if (!nextFaction) {
      throw new Error('A destination faction is required for reassignment.')
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, username, role, faction, character_match_id, rank, ap_total, quiz_completed, assignment_flag_used, created_at, exam_retake_eligible_at')
      .eq('id', record.user_id)
      .maybeSingle()

    const userProfile = (profile as Profile | null) ?? null

    if (!userProfile) {
      return null
    }

    if (
      (userProfile.role === 'member' || userProfile.role === 'mod') &&
      userProfile.faction &&
      VISIBLE_FACTIONS.includes(userProfile.faction as VisibleFactionId)
    ) {
      await adjustSlotCount(userProfile.faction, -1)
    }

    const existingWaitlist = await WaitlistModel.removeByUser(userProfile.id)

    const { data: slot } = await supabaseAdmin
      .from('faction_slots')
      .select('active_count, max_slots')
      .eq('faction', nextFaction)
      .maybeSingle()

    const hasSpace = Boolean(slot && slot.active_count < slot.max_slots)

    if (hasSpace) {
      await supabaseAdmin
        .from('profiles')
        .update({
          role: 'member',
          faction: nextFaction,
          character_name: null,
          character_match_id: null,
          character_ability: null,
          character_ability_jp: null,
          character_description: null,
          character_type: null,
          character_assigned_at: null,
          quiz_completed: true,
          quiz_locked: true,
          exam_retake_eligible_at:
            userProfile.exam_retake_eligible_at ?? buildExamRetakeEligibleAtIso(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userProfile.id)

      await adjustSlotCount(nextFaction, 1)
    } else {
      await supabaseAdmin
        .from('profiles')
        .update({
          role: 'waitlist',
          faction: nextFaction,
          character_name: null,
          character_match_id: null,
          character_ability: null,
          character_ability_jp: null,
          character_description: null,
          character_type: null,
          character_assigned_at: null,
          quiz_completed: true,
          quiz_locked: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userProfile.id)

      await WaitlistModel.enqueue(
        userProfile.id,
        nextFaction,
        null,
        (existingWaitlist?.trait_scores ?? {}) as Record<string, number>,
      )
    }

    await supabaseAdmin
      .from('assignment_flags')
      .update({
        status: 'reassigned',
        notes: `Owner reassigned this file to ${nextFaction}.`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', flagId)

    await createNotification(
      userProfile.id,
      'assignment_flag_reassigned',
      `Observation complete. Your assignment has been changed to ${FACTION_META[nextFaction].name}.`,
      {
        faction: nextFaction,
        role: hasSpace ? 'member' : 'waitlist',
      },
    )

    return {
      ...record,
      status: 'reassigned' as const,
    }
  },

  async assignReservedCharacter(userId: string, slug: string) {
    const { data: reserved } = await supabaseAdmin
      .from('reserved_characters')
      .select('slug, character_name, faction, reserved_reason, assigned_to, assigned_at')
      .eq('slug', slug)
      .maybeSingle()

    const reservedCharacter = (reserved as {
      slug: string
      character_name: string
      faction: FactionId
      reserved_reason: string | null
      assigned_to: string | null
    } | null) ?? null

    if (!reservedCharacter) {
      return { error: 'Reserved character not found.' }
    }

    if (reservedCharacter.assigned_to && reservedCharacter.assigned_to !== userId) {
      return { error: 'This reserved character is already assigned.' }
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select(
        'id, username, role, faction, character_match_id, exam_completed, exam_retake_eligible_at',
      )
      .eq('id', userId)
      .maybeSingle()

    const userProfile = (profile as Pick<
      Profile,
      | 'id'
      | 'username'
      | 'role'
      | 'faction'
      | 'character_match_id'
      | 'exam_completed'
      | 'exam_retake_eligible_at'
    > | null) ?? null

    if (!userProfile) {
      return { error: 'User not found.' }
    }

    if (userProfile.character_match_id && userProfile.character_match_id !== slug) {
      return { error: 'This user already has a different character assignment.' }
    }

    const character = getCharacterReveal(slug)
    const abilityType = getAbilityTypeForCharacter(slug)

    if (!character || !abilityType) {
      return { error: 'Character registry data is incomplete for this slug.' }
    }

    const targetFaction = reservedCharacter.faction
    const now = new Date().toISOString()
    const currentlyTracked =
      Boolean(userProfile.faction) &&
      (userProfile.role === 'member' || userProfile.role === 'mod')
    const retainsCurrentSlot =
      currentlyTracked && userProfile.faction === targetFaction

    if (!retainsCurrentSlot && !(await hasTrackedSlotCapacity(targetFaction))) {
      return {
        error: `No slot is open for ${FACTION_META[targetFaction]?.name ?? targetFaction}.`,
      }
    }

    if (
      currentlyTracked &&
      userProfile.faction &&
      userProfile.faction !== targetFaction
    ) {
      await adjustSlotCount(userProfile.faction, -1)
    }

    if (!retainsCurrentSlot) {
      await adjustSlotCount(targetFaction, 1)
    }

    await WaitlistModel.removeByUser(userId)
    await supabaseAdmin.from('observer_pool').delete().eq('user_id', userId)

    const nextRole =
      userProfile.role === 'owner'
        ? 'owner'
        : userProfile.role === 'mod'
          ? 'mod'
          : 'member'

    await supabaseAdmin
      .from('profiles')
      .update({
        role: nextRole,
        faction: targetFaction,
        character_name: character.name,
        character_match_id: slug,
        character_ability: character.ability,
        character_ability_jp: character.abilityJp,
        character_type: abilityType,
        character_description:
          `Registry control has sealed this file under ${character.name}. Manual designation overrides the standard behavioral queue.`,
        character_assigned_at: now,
        exam_completed: true,
        quiz_completed: true,
        quiz_locked: true,
        exam_retake_eligible_at:
          userProfile.exam_retake_eligible_at ?? buildExamRetakeEligibleAtIso(),
        updated_at: now,
      })
      .eq('id', userId)

    await supabaseAdmin
      .from('reserved_characters')
      .update({
        assigned_to: userId,
        assigned_at: now,
      })
      .eq('slug', slug)

    await createNotification(
      userId,
      'character_assigned',
      'Registry control has manually sealed your character file.',
      {
        character_slug: slug,
        reserved: true,
        faction: targetFaction,
      },
    )

    await supabaseAdmin.from('faction_activity').insert({
      faction_id: targetFaction,
      event_type: 'character_assigned',
      description: `Reserved designation confirmed - ${character.name}`,
      actor_id: userId,
    })

    await supabaseAdmin.from('user_events').insert({
      user_id: userId,
      event_type: 'character_assigned',
      ap_awarded: 0,
      faction: targetFaction,
      metadata: {
        character_slug: slug,
        reserved: true,
        source: 'owner',
      },
    })

    return {
      data: {
        slug,
        targetFaction,
        username: userProfile.username,
        characterName: character.name,
      },
    }
  },
}
