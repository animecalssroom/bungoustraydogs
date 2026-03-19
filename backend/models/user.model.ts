import { supabaseAdmin } from '@/backend/lib/supabase'
import { EXAM_RETAKE_COST, getExamRetakeStatus } from '@/backend/lib/exam-retake'
import { AP_VALUES, type Profile, type UserEvent, type UserEventType } from '@/backend/types'
import { CharacterAssignmentModel } from '@/backend/models/character-assignment.model'
import { checkAssignmentTrigger } from '@/src/lib/assignment/checkAssignmentTrigger'
import { redis } from '@/lib/redis'
import { cache } from '@/backend/lib/cache'
import { FactionWarModel } from './faction-war.model'
import { WarContributionModel } from './war-contribution.model'

const PROFILE_SELECT = 'id, username, username_confirmed, email, avatar_url, bio, theme, role, faction, character_name, character_match_id, character_ability, character_ability_jp, character_description, character_type, character_assigned_at, secondary_character_slug, secondary_character_name, exam_completed, exam_taken_at, exam_answers, exam_scores, quiz_scores, exam_status, quiz_completed, quiz_locked, assignment_flag_used, trait_scores, behavior_scores, avg_move_speed_minutes, duel_moves_count, exam_retake_eligible_at, exam_retake_used, ap_total, rank, duel_wins, duel_losses, is_bot, login_streak, guide_bot_dismissed, guide_bot_opened_at, last_seen, created_at, updated_at, recovery_until, recovery_status'

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
    const cacheKey = `profile:id:${id}`
    
    // Check cache first
    const cached = await cache.getOrSet(cacheKey, 3600, async () => {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select(PROFILE_SELECT)
        .eq('id', id)
        .maybeSingle()

      if (error) {
        console.error(`[UserModel:getById] DB Error for ${id}:`, error)
        return null
      }

      return (data as Profile | null) ?? null
    })

    // If we got null, let's make sure we didn't just cache a negative result
    // by invalidating it so the NEXT call actually hits the DB if this one failed.
    if (!cached) {
      await this.invalidateCache(id)
    }

    return cached
  },

  async invalidateCache(id: string) {
    await cache.invalidate(`profile:id:${id}`)
  },

  async getByUsername(username: string): Promise<Profile | null> {
    const normalizedUsername = username.trim().replace(/^@+/, '')

    const cacheKey = `profile:username:${normalizedUsername.toLowerCase()}`

    return cache.getOrSet(cacheKey, 300, async () => {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select(PROFILE_SELECT)
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
        .select(PROFILE_SELECT)
        .ilike('username', normalizedUsername)
        .limit(5)

      const exactMatch =
        ((fallback.data as Profile[] | null) ?? []).find(
          (profile) => profile.username.trim().toLowerCase() === normalizedUsername.toLowerCase(),
        ) ?? null

      return exactMatch ?? null
    })
  },

  async update(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    const { data } = await supabaseAdmin
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(PROFILE_SELECT)
      .single()

    if (data) {
      await this.invalidateCache(id)
    }

    return (data as Profile | null) ?? null
  },

  async getRecentEvents(userId: string, limit = 50) {
    const key = `user_events:${userId}:limit:${limit}`
    return cache.getOrSet(key, 60, async () => {
      const { data } = await supabaseAdmin
        .from('user_events')
        .select('id, user_id, event_type, faction, ap_awarded, metadata, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      return (data as UserEvent[] | null) ?? []
    })
  },

  async shouldThrottleBehaviorEvent(
    userId: string,
    eventType: UserEventType,
    metadata: Record<string, unknown> = {},
  ) {
    if (!['feed_view', 'archive_read', 'profile_view'].includes(eventType)) {
      return false
    }

    const todayKey = getTokyoDateKey(new Date())
    const cacheKey = `throttle:${userId}:${eventType}:${todayKey}`

    try {
      // Fast path: Check and update Redis throttling counters
      if (eventType === 'feed_view') {
        const count = await redis.incr(cacheKey)
        if (count === 1) await redis.expire(cacheKey, 86400)
        return count > 1
      }

      if (eventType === 'archive_read') {
        const slug = String(metadata.slug || '').trim().toLowerCase()
        if (!slug) return true
        
        const setKey = `${cacheKey}:slugs`
        const [isNew, total] = await Promise.all([
          redis.sadd(setKey, slug),
          redis.scard(setKey)
        ])
        if (isNew === 1) await redis.expire(setKey, 86400)
        // Throttle if already read today OR if they've already hit 10 unique slugs
        return isNew === 0 || total > 10
      }

      if (eventType === 'profile_view') {
        const username = String(metadata.username || '').trim().toLowerCase()
        if (!username) return true

        const setKey = `${cacheKey}:users`
        const isNew = await redis.sadd(setKey, username)
        if (isNew === 1) await redis.expire(setKey, 86400)
        return isNew === 0
      }
    } catch (e) {
      console.warn(`[UserModel] Redis throttle failed, falling back to DB:`, e)
    }

    // Fallback: DB count (expensive but safe)
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const { data } = await supabaseAdmin
      .from('user_events')
      .select('event_type, metadata')
      .eq('user_id', userId)
      .eq('event_type', eventType)
      .gte('created_at', todayStart.toISOString())

    const events = (data ?? []) as any[]

    if (eventType === 'feed_view') return events.length > 0
    if (eventType === 'profile_view') {
      const target = String(metadata.username || '').trim().toLowerCase()
      return events.some(e => String(e.metadata?.username || '').toLowerCase() === target)
    }
    if (eventType === 'archive_read') {
      const target = String(metadata.slug || '').trim().toLowerCase()
      return events.some(e => String(e.metadata?.slug || '').toLowerCase() === target) || events.length >= 10
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

    const { calculateRank } = await import('@/backend/types')
    const currentRank = profile?.rank ?? 1
    const nextTotal = Math.max(0, (profile?.ap_total ?? 0) + apAwarded)
    const nextRank = calculateRank(nextTotal)

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
          rank: nextRank,
          updated_at: now,
        })
        .eq('id', userId)

      if (nextRank > currentRank) {
        await supabaseAdmin.from('notifications').insert({
          user_id: userId,
          type: 'rank_up',
          message: `Rank ${nextRank} achieved.`,
          payload: { old_rank: currentRank, new_rank: nextRank },
        })
      }

      await this.invalidateCache(userId)
      // Background the assignment trigger to prevent blocking critical actions (like chat)
      checkAssignmentTrigger(userId).catch(err => {
        console.error(`[assignment-trigger] Background error for user ${userId}:`, err)
      })
      return
    }

    await supabaseAdmin
      .from('profiles')
      .update({
        ap_total: nextTotal,
        rank: nextRank,
        behavior_scores: nextBehaviorScores,
        updated_at: now,
      })
      .eq('id', userId)

    if (nextRank > currentRank) {
      await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        type: 'rank_up',
        message: `Rank ${nextRank} achieved.`,
        payload: { old_rank: currentRank, new_rank: nextRank },
      })
    }

    await this.invalidateCache(userId)
    await supabaseAdmin.from('user_events').insert({
      user_id: userId,
      event_type: eventType,
      ap_awarded: apAwarded,
      faction,
      metadata: metadata ?? {},
    })

    try {
      const { redis } = await import('@/src/lib/redis')
      await redis.del(`event_summary:${userId}`)
    } catch (e) {
      /* ignore cache-bust error */
    }

    // Background the assignment trigger to prevent blocking critical actions (like chat)
    checkAssignmentTrigger(userId).catch((err) => {
      console.error(`[assignment-trigger] Background error for user ${userId}:`, err)
    })
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

    await this.invalidateCache(userId)
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

    // War Points
    const activeWar = await FactionWarModel.getActiveWar()
    if (activeWar && profile.faction && (activeWar.faction_a_id === profile.faction || activeWar.faction_b_id === profile.faction)) {
      await WarContributionModel.addContribution({
        warId: activeWar.id,
        userId: userId,
        type: 'daily_login',
        points: 1
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

    await this.invalidateCache(userId)
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

    try {
      await redis.del(`event_summary:${userId}`)
    } catch (e) {
      /* ignore cache-bust error */
    }

    return {
      data: {
        apSpent: EXAM_RETAKE_COST,
        apTotal: nextApTotal,
        redirectTo: '/onboarding/quiz?retake=1',
      },
    }
  },

  async setUserMIA(userId: string, hours: number, status: string = 'mia') {
    const recoveryUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
    const { data } = await supabaseAdmin
      .from('profiles')
      .update({ 
        recovery_until: recoveryUntil,
        recovery_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select(PROFILE_SELECT)
      .single()

    if (data) {
      await this.invalidateCache(userId)
    }
    return data as Profile | null
  },

  isUserMIA(profile: Profile | null): boolean {
    if (!profile || !profile.recovery_until) return false
    return new Date(profile.recovery_until).getTime() > Date.now()
  },
}
