import { supabaseAdmin } from '@/backend/lib/supabase'
import {
  SupportModel,
  type ContentFlagQueueItem,
  type TicketQueueItem,
} from '@/backend/models/support.model'
import type {
  FactionId,
  ObserverPoolEntry,
  Profile,
} from '@/backend/types'

export interface SpecialDivisionCandidate {
  observer_pool_id: string | null
  user_id: string
  username: string
  joined_at: string
  source: 'unplaceable' | 'long_term_waitlist'
  faction: FactionId | null
  scores: Record<string, number>
  action_count: number
  status: ObserverPoolEntry['status']
  can_recommend: boolean
  can_recommend_again_at: string | null
}

export interface SpecialDivisionRecommendation {
  observer_pool_id: string
  user_id: string
  username: string
  faction: FactionId | null
  scores: Record<string, number>
  action_count: number
  recommended_at: string | null
  recommended_by_username: string
}

export interface SpecialDivisionTicket extends TicketQueueItem {}

export interface SpecialDivisionContentFlag extends ContentFlagQueueItem {}

type ProfileLookup = Pick<
  Profile,
  'id' | 'username' | 'role' | 'faction' | 'created_at' | 'exam_scores' | 'exam_status'
>

function nowIso() {
  return new Date().toISOString()
}

async function findOwnerUserId() {
  if (process.env.OWNER_USER_ID) {
    return process.env.OWNER_USER_ID
  }

  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle()

  return data?.id ?? null
}

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

function isEligibleAgain(value: string | null) {
  if (!value) {
    return true
  }

  return new Date(value).getTime() <= Date.now()
}

async function loadProfiles(userIds: string[]) {
  if (userIds.length === 0) {
    return {} as Record<string, ProfileLookup>
  }

  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, username, role, faction, created_at, exam_scores, exam_status')
    .in('id', userIds)

  return (data ?? []).reduce<Record<string, ProfileLookup>>((map, row) => {
    map[row.id] = row as ProfileLookup
    return map
  }, {})
}

async function loadActionCounts(userIds: string[]) {
  if (userIds.length === 0) {
    return {} as Record<string, number>
  }

  const { data } = await supabaseAdmin
    .from('user_events')
    .select('user_id')
    .in('user_id', userIds)

  return (data ?? []).reduce<Record<string, number>>((map, row) => {
    map[row.user_id] = (map[row.user_id] ?? 0) + 1
    return map
  }, {})
}

async function markOwnerRecommendationNotificationsRead(
  observerPoolId: string,
) {
  const ownerId = await findOwnerUserId()

  if (!ownerId) {
    return
  }

  await supabaseAdmin
    .from('notifications')
    .update({ read_at: nowIso() })
    .eq('user_id', ownerId)
    .eq('type', 'special_division_recommendation')
    .contains('payload', { observer_pool_id: observerPoolId })
    .is('read_at', null)
}

export const SpecialDivisionModel = {
  async getDashboard() {
    const cutoff = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()

    const [observerResult, waitlistResult] = await Promise.all([
      supabaseAdmin
        .from('observer_pool')
        .select('id, user_id, scores, status, can_recommend_again_at, created_at, recommended_by, recommended_at, reviewed_at')
        .in('status', ['waiting', 'declined'])
        .order('created_at', { ascending: true })
        .limit(100),
      supabaseAdmin
        .from('waitlist')
        .select('id, user_id, faction, joined_at')
        .lte('joined_at', cutoff)
        .order('joined_at', { ascending: true })
        .limit(100),
    ])

    const observerRows = ((observerResult.data ?? []) as ObserverPoolEntry[]).filter(
      (row) => row.status === 'waiting' || isEligibleAgain(row.can_recommend_again_at),
    )
    const waitlistRows = waitlistResult.data ?? []

    const userIds = Array.from(
      new Set([
        ...observerRows.map((row) => row.user_id),
        ...waitlistRows.map((row) => row.user_id),
      ]),
    )

    const [profiles, actionCounts] = await Promise.all([
      loadProfiles(userIds),
      loadActionCounts(userIds),
    ])

    const observerMap = observerRows.reduce<Record<string, ObserverPoolEntry>>((map, row) => {
      map[row.user_id] = row
      return map
    }, {})

    const unplaceable = observerRows
      .filter((row) => {
        const profile = profiles[row.user_id]
        return profile?.role === 'observer'
      })
      .map<SpecialDivisionCandidate>((row) => {
        const profile = profiles[row.user_id]
        return {
          observer_pool_id: row.id,
          user_id: row.user_id,
          username: profile?.username ?? 'Unknown User',
          joined_at: row.created_at,
          source: 'unplaceable',
          faction: profile?.faction ?? null,
          scores: (row.scores as Record<string, number>) ?? {},
          action_count: actionCounts[row.user_id] ?? 0,
          status: row.status,
          can_recommend: row.status === 'waiting' || isEligibleAgain(row.can_recommend_again_at),
          can_recommend_again_at: row.can_recommend_again_at,
        }
      })

    const longTermWaitlist = waitlistRows
      .filter((row) => {
        const profile = profiles[row.user_id]
        if (!profile || profile.role !== 'waitlist') {
          return false
        }

        const observerEntry = observerMap[row.user_id]

        if (!observerEntry) {
          return true
        }

        if (observerEntry.status === 'recommended' || observerEntry.status === 'approved') {
          return false
        }

        return observerEntry.status === 'waiting' || isEligibleAgain(observerEntry.can_recommend_again_at)
      })
      .map<SpecialDivisionCandidate>((row) => {
        const profile = profiles[row.user_id]
        const observerEntry = observerMap[row.user_id]

        return {
          observer_pool_id: observerEntry?.id ?? null,
          user_id: row.user_id,
          username: profile?.username ?? 'Unknown User',
          joined_at: row.joined_at,
          source: 'long_term_waitlist',
          faction: row.faction as FactionId,
          scores: ((observerEntry?.scores ?? profile?.exam_scores ?? {}) as Record<string, number>) ?? {},
          action_count: actionCounts[row.user_id] ?? 0,
          status: observerEntry?.status ?? 'waiting',
          can_recommend:
            !observerEntry ||
            observerEntry.status === 'waiting' ||
            isEligibleAgain(observerEntry.can_recommend_again_at),
          can_recommend_again_at: observerEntry?.can_recommend_again_at ?? null,
        }
      })

    const [tickets, contentFlags] = await Promise.all([
      SupportModel.getQueueTickets('special_division'),
      SupportModel.getQueueFlags('special_division'),
    ])

    return {
      unplaceable,
      longTermWaitlist,
      tickets,
      contentFlags,
    }
  },

  async getOwnerRecommendations(): Promise<SpecialDivisionRecommendation[]> {
    const { data } = await supabaseAdmin
      .from('observer_pool')
      .select('id, user_id, scores, status, can_recommend_again_at, created_at, recommended_by, recommended_at, reviewed_at')
      .eq('status', 'recommended')
      .order('recommended_at', { ascending: true })
      .limit(100)

    const rows = (data ?? []) as ObserverPoolEntry[]
    const userIds = Array.from(
      new Set(
        rows.flatMap((row) => [row.user_id, row.recommended_by].filter(Boolean) as string[]),
      ),
    )

    const [profiles, actionCounts] = await Promise.all([
      loadProfiles(userIds),
      loadActionCounts(rows.map((row) => row.user_id)),
    ])

    return rows.map((row) => ({
      observer_pool_id: row.id,
      user_id: row.user_id,
      username: profiles[row.user_id]?.username ?? 'Unknown User',
      faction: profiles[row.user_id]?.faction ?? null,
      scores: (row.scores as Record<string, number>) ?? {},
      action_count: actionCounts[row.user_id] ?? 0,
      recommended_at: row.recommended_at,
      recommended_by_username:
        (row.recommended_by && profiles[row.recommended_by]?.username) ?? 'Unknown Reviewer',
    }))
  },

  async recommendUser(userId: string, recommender: Pick<Profile, 'id' | 'role' | 'faction'>) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, username, role, faction, exam_scores, exam_status')
      .eq('id', userId)
      .maybeSingle()

    const candidate = (profile as ProfileLookup | null) ?? null

    if (!candidate) {
      return { error: 'User not found.' }
    }

    if (
      candidate.role === 'member' &&
      candidate.faction === 'special_div' &&
      candidate.exam_status === 'special_division'
    ) {
      return { error: 'This user has already been assigned to the Special Division.' }
    }

    const { data: existing } = await supabaseAdmin
      .from('observer_pool')
      .select('id, user_id, scores, status, can_recommend_again_at, created_at, recommended_by, recommended_at, reviewed_at')
      .eq('user_id', userId)
      .maybeSingle()

    const observerEntry = (existing as ObserverPoolEntry | null) ?? null

    if (
      observerEntry?.status === 'declined' &&
      observerEntry.can_recommend_again_at &&
      !isEligibleAgain(observerEntry.can_recommend_again_at)
    ) {
      return {
        error: `This file cannot be recommended again until ${new Date(
          observerEntry.can_recommend_again_at,
        ).toLocaleDateString()}.`,
      }
    }

    if (observerEntry?.status === 'recommended') {
      return { error: 'This file has already been recommended for owner review.' }
    }

    const { count } = await supabaseAdmin
      .from('user_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    const now = nowIso()
    const scores =
      ((observerEntry?.scores ?? candidate.exam_scores ?? {}) as Record<string, number>) ?? {}

    const { data: upserted, error } = await supabaseAdmin
      .from('observer_pool')
      .upsert(
        {
          user_id: userId,
          scores,
          status: 'recommended',
          recommended_by: recommender.id,
          recommended_at: now,
          reviewed_at: null,
          can_recommend_again_at: null,
          updated_at: now,
        },
        { onConflict: 'user_id' },
      )
      .select('id, user_id, scores, status, can_recommend_again_at, created_at, recommended_by, recommended_at, reviewed_at')
      .single()

    if (error || !upserted) {
      return { error: error?.message ?? 'Unable to recommend this file.' }
    }

    const ownerId = await findOwnerUserId()

    if (ownerId) {
      await createNotification(
        ownerId,
        'special_division_recommendation',
        `${candidate.username} has been recommended for the Special Division.`,
        {
          observer_pool_id: upserted.id,
          user_id: candidate.id,
          username: candidate.username,
          scores,
          action_count: count ?? 0,
          recommended_by: recommender.id,
        },
      )
    }

    return { data: upserted as ObserverPoolEntry }
  },

  async resolveRecommendation(
    observerPoolId: string,
    action: 'approve' | 'decline',
  ) {
    const { data } = await supabaseAdmin
      .from('observer_pool')
      .select('id, user_id, scores, status, can_recommend_again_at, created_at, recommended_by, recommended_at, reviewed_at')
      .eq('id', observerPoolId)
      .maybeSingle()

    const row = (data as ObserverPoolEntry | null) ?? null

    if (!row) {
      return { error: 'Observation file not found.' }
    }

    if (row.status !== 'recommended') {
      return { error: 'This observation file is not awaiting owner review.' }
    }

    if (action === 'approve') {
      const { error } = await supabaseAdmin.rpc('assign_special_division', {
        p_user_id: row.user_id,
      })

      if (error) {
        return { error: error.message }
      }

      await markOwnerRecommendationNotificationsRead(observerPoolId)

      const { data: updated } = await supabaseAdmin
        .from('observer_pool')
        .select('id, user_id, scores, status, can_recommend_again_at, created_at, recommended_by, recommended_at, reviewed_at')
        .eq('id', observerPoolId)
        .maybeSingle()

      return { data: (updated as ObserverPoolEntry | null) ?? row }
    }

    const reviewedAt = nowIso()
    const canRecommendAgainAt = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString()

    const { data: updated, error } = await supabaseAdmin
      .from('observer_pool')
      .update({
        status: 'declined',
        reviewed_at: reviewedAt,
        can_recommend_again_at: canRecommendAgainAt,
        updated_at: reviewedAt,
      })
      .eq('id', observerPoolId)
      .select('id, user_id, scores, status, can_recommend_again_at, created_at, recommended_by, recommended_at, reviewed_at')
      .single()

    if (error || !updated) {
      return { error: error?.message ?? 'Unable to decline this observation file.' }
    }

    await markOwnerRecommendationNotificationsRead(observerPoolId)

    return { data: updated as ObserverPoolEntry }
  },
}
