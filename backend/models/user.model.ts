import { supabaseAdmin } from '@/backend/lib/supabase'
import { EXAM_RETAKE_COST, getExamRetakeStatus } from '@/backend/lib/exam-retake'
import { AP_VALUES, type Profile, type UserEvent, type UserEventType } from '@/backend/types'
import { CharacterAssignmentModel } from '@/backend/models/character-assignment.model'

const TOKYO_TIME_ZONE = 'Asia/Tokyo'

function getTokyoDateKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TOKYO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value ?? '0000'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'

  return `${year}-${month}-${day}`
}

export const UserModel = {
  async getById(id: string): Promise<Profile | null> {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    return (data as Profile | null) ?? null
  },

  async getByUsername(username: string): Promise<Profile | null> {
    const normalizedUsername = username.trim().replace(/^@+/, '')

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('username', normalizedUsername)
      .maybeSingle()

    if (data) {
      return data as Profile
    }

    if (error && !error.message.toLowerCase().includes('multiple')) {
      return null
    }

    const fallback = await supabaseAdmin
      .from('profiles')
      .select('*')
      .ilike('username', normalizedUsername)
      .limit(5)

    const exactMatch =
      ((fallback.data as Profile[] | null) ?? []).find(
        (profile) => profile.username.trim().toLowerCase() === normalizedUsername.toLowerCase(),
      ) ?? null

    return exactMatch
  },

  async update(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    const { data } = await supabaseAdmin
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    return (data as Profile | null) ?? null
  },

  async getRecentEvents(userId: string, limit = 50) {
    const { data } = await supabaseAdmin
      .from('user_events')
      .select('id, user_id, event_type, faction, ap_awarded, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    return (data as UserEvent[] | null) ?? []
  },

  async shouldThrottleBehaviorEvent(
    userId: string,
    eventType: UserEventType,
    metadata: Record<string, unknown> = {},
  ) {
    if (!['feed_view', 'archive_read', 'profile_view'].includes(eventType)) {
      return false
    }

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setUTCHours(0, 0, 0, 0)

    const { data } = await supabaseAdmin
      .from('user_events')
      .select('event_type, metadata, created_at')
      .eq('user_id', userId)
      .eq('event_type', eventType)
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false })

    const events =
      (data as Array<{
        event_type: UserEventType
        metadata?: Record<string, unknown> | null
        created_at: string
      }> | null) ?? []

    if (eventType === 'feed_view') {
      return events.length > 0
    }

    if (eventType === 'archive_read') {
      return events.length >= 5
    }

    if (eventType === 'profile_view') {
      const targetUsername =
        typeof metadata.username === 'string' ? metadata.username.trim().toLowerCase() : ''

      if (!targetUsername) {
        return false
      }

      return events.some((event) => {
        const eventUsername =
          typeof event.metadata?.username === 'string'
            ? event.metadata.username.trim().toLowerCase()
            : ''
        return eventUsername === targetUsername
      })
    }

    return false
  },

  async addAp(
    userId: string,
    eventType: UserEventType,
    apAwarded: number,
    metadata?: Record<string, unknown>,
  ) {
    if (await this.shouldThrottleBehaviorEvent(userId, eventType, metadata ?? {})) {
      return
    }

    const profile = await this.getById(userId)
    const faction = profile?.faction ?? null
    const now = new Date().toISOString()
    const nextBehaviorScores = CharacterAssignmentModel.updateBehaviorProfile(
      profile?.behavior_scores ?? null,
      eventType,
      metadata,
    )

    const { error } = await supabaseAdmin.rpc('award_ap', {
      p_user_id: userId,
      p_amount: apAwarded,
      p_event_type: eventType,
      p_metadata: metadata ?? {},
    })

    if (!error) {
      await supabaseAdmin
        .from('profiles')
        .update({
          behavior_scores: nextBehaviorScores,
          updated_at: now,
        })
        .eq('id', userId)

      await CharacterAssignmentModel.assignIfEligible(userId)
      return
    }

    const nextTotal = Math.max(0, (profile?.ap_total ?? 0) + apAwarded)

    await supabaseAdmin
      .from('profiles')
      .update({
        ap_total: nextTotal,
        behavior_scores: nextBehaviorScores,
        updated_at: now,
      })
      .eq('id', userId)

    await supabaseAdmin.from('user_events').insert({
      user_id: userId,
      event_type: eventType,
      ap_awarded: apAwarded,
      faction,
      metadata: metadata ?? {},
    })

    await CharacterAssignmentModel.assignIfEligible(userId)
  },

  async claimDailyLogin(userId: string) {
    const profile = await this.getById(userId)

    if (!profile) {
      return null
    }

    const { data: latestLogin } = await supabaseAdmin
      .from('user_events')
      .select('created_at')
      .eq('user_id', userId)
      .eq('event_type', 'daily_login')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const now = new Date()
    const todayKey = getTokyoDateKey(now)
    const latestKey = latestLogin?.created_at
      ? getTokyoDateKey(latestLogin.created_at)
      : null

    if (latestKey === todayKey) {
      return {
        alreadyClaimed: true,
        streak: profile.login_streak,
        awardedAp: 0,
        bonusAwarded: 0,
        dateKey: todayKey,
      }
    }

    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const streak =
      latestKey === getTokyoDateKey(yesterday)
        ? Math.max(1, profile.login_streak) + 1
        : 1

    const nowIso = now.toISOString()

    await supabaseAdmin
      .from('profiles')
      .update({
        login_streak: streak,
        last_seen: nowIso,
        updated_at: nowIso,
      })
      .eq('id', userId)

    await this.addAp(userId, 'daily_login', AP_VALUES.daily_login, {
      streak,
      date_key: todayKey,
    })

    let bonusAwarded = 0

    if ([3, 7, 14, 30].includes(streak)) {
      bonusAwarded = AP_VALUES.login_streak
      await this.addAp(userId, 'login_streak', bonusAwarded, {
        streak,
        milestone: true,
        date_key: todayKey,
      })
    }

    return {
      alreadyClaimed: false,
      streak,
      awardedAp: AP_VALUES.daily_login + bonusAwarded,
      bonusAwarded,
      dateKey: todayKey,
    }
  },

  async beginExamRetake(userId: string) {
    const profile = await this.getById(userId)

    if (!profile) {
      return { error: 'Profile not found.' }
    }

    const retake = getExamRetakeStatus(profile)

    if (retake.retakeInProgress) {
      return {
        error: 'A retake is already in progress for this file. Complete the exam first.',
      }
    }

    if (profile.exam_retake_used) {
      return { error: 'This file has already used its one retake.' }
    }

    if (!retake.eligibleAt || retake.eligibleAt.getTime() > Date.now()) {
      return { error: 'This file is not eligible for a retake yet.' }
    }

    if (retake.apShortfall > 0) {
      return {
        error: `A retake requires ${EXAM_RETAKE_COST} AP. ${retake.apShortfall} AP still missing.`,
      }
    }

    const nowIso = new Date().toISOString()
    const nextApTotal = Math.max(0, profile.ap_total - EXAM_RETAKE_COST)

    await supabaseAdmin
      .from('profiles')
      .update({
        ap_total: nextApTotal,
        quiz_completed: false,
        quiz_locked: false,
        exam_retake_used: true,
        updated_at: nowIso,
      })
      .eq('id', userId)

    await supabaseAdmin.from('user_events').insert({
      user_id: userId,
      event_type: 'exam_retake',
      ap_awarded: -EXAM_RETAKE_COST,
      faction: profile.faction,
      metadata: {
        ap_spent: EXAM_RETAKE_COST,
        previous_faction: profile.faction,
        previous_character: profile.character_match_id,
      },
    })

    return {
      data: {
        apSpent: EXAM_RETAKE_COST,
        apTotal: nextApTotal,
        redirectTo: '/onboarding/quiz?retake=1',
      },
    }
  },
}
