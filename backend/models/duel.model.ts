import { supabaseAdmin } from '@/backend/lib/supabase'
import { invalidateNotificationsCache } from '@/backend/lib/notifications-cache'
import type { Duel, OpenChallenge, Profile } from '@/backend/types'
import {
  canIssueFactionChallenge,
  canUseDuelSystem,
  computeDuelMaxHp,
  duelIdentityLabel,
  DUEL_ROUND_DURATION_MS,
  PENDING_DUEL_LIMIT,
} from '@/lib/duels/shared'

const DUEL_SELECT =
  'id, challenger_id, defender_id, challenger_character, defender_character, challenger_character_slug, defender_character_slug, challenger_faction, defender_faction, status, current_round, challenger_hp, defender_hp, challenger_max_hp, defender_max_hp, winner_id, loser_id, challenge_message, challenge_expires_at, accepted_at, completed_at, created_at'

const OPEN_CHALLENGE_SELECT =
  'id, challenger_id, faction, character_name, message, status, accepted_by, duel_id, expires_at, created_at'

type DuelParticipant = Pick<
  Profile,
  | 'id'
  | 'username'
  | 'role'
  | 'faction'
  | 'character_name'
  | 'character_match_id'
  | 'rank'
> & {
  duel_wins?: number | null
  duel_losses?: number | null
  is_bot?: boolean | null
}

const PARTICIPANT_SELECT_FULL =
  'id, username, role, faction, character_name, character_match_id, rank, duel_wins, duel_losses, is_bot'

const PARTICIPANT_SELECT_BASE =
  'id, username, role, faction, character_name, character_match_id, rank'

function normalizeDuel(row: Partial<Duel> & { id: string }) {
  return row as Duel
}

function normalizeOpenChallenge(row: Partial<OpenChallenge> & { id: string }) {
  return row as OpenChallenge
}

export const DuelModel = {
  async expirePendingChallengesForUsers(userIds: string[]) {
    if (!userIds.length) {
      return
    }

    const now = new Date().toISOString()

    await supabaseAdmin
      .from('duels')
      .update({ status: 'declined' })
      .eq('status', 'pending')
      .lt('challenge_expires_at', now)
      .in('challenger_id', userIds)

    await supabaseAdmin
      .from('duels')
      .update({ status: 'declined' })
      .eq('status', 'pending')
      .lt('challenge_expires_at', now)
      .in('defender_id', userIds)
  },

  async getParticipant(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(PARTICIPANT_SELECT_FULL)
      .eq('id', userId)
      .maybeSingle()

    if (error && (error.message.includes('duel_wins') || error.message.includes('duel_losses') || error.message.includes('is_bot'))) {
      const fallback = await supabaseAdmin
        .from('profiles')
        .select(PARTICIPANT_SELECT_BASE)
        .eq('id', userId)
        .maybeSingle()

      if (!fallback.data) {
        return null
      }

      return {
        ...(fallback.data as DuelParticipant),
        duel_wins: 0,
        duel_losses: 0,
        is_bot: false,
      }
    }

    return (data as DuelParticipant | null) ?? null
  },

  async getPendingOrActiveCount(userId: string) {
    const { count } = await supabaseAdmin
      .from('duels')
      .select('id', { count: 'exact', head: true })
      .or(`challenger_id.eq.${userId},defender_id.eq.${userId}`)
      .in('status', ['pending', 'active'])

    return count ?? 0
  },

  async getExistingPairDuel(challengerId: string, defenderId: string) {
    const { data } = await supabaseAdmin
      .from('duels')
      .select('id, status')
      .or(
        `and(challenger_id.eq.${challengerId},defender_id.eq.${defenderId}),and(challenger_id.eq.${defenderId},defender_id.eq.${challengerId})`,
      )
      .in('status', ['pending', 'active'])
      .limit(1)
      .maybeSingle()

    return data
  },

  async createChallenge(challenger: DuelParticipant, defender: DuelParticipant, message?: string) {
    if (!canUseDuelSystem(challenger) || !canUseDuelSystem(defender)) {
      return { error: 'Only regular faction operatives can use the duel registry.' as const }
    }

    await this.expirePendingChallengesForUsers([challenger.id, defender.id])

    if (!canIssueFactionChallenge(challenger, defender)) {
      return {
        error: 'The registry does not permit internal disputes through this channel.' as const,
      }
    }

    const existing = await this.getExistingPairDuel(challenger.id, defender.id)
    if (existing) {
      return { error: 'A registry duel already exists between these operatives.' as const }
    }

    const challengerPendingCount = await this.getPendingOrActiveCount(challenger.id)
    if (challengerPendingCount >= PENDING_DUEL_LIMIT) {
      return { error: 'You already have too many active or pending duels on file.' as const }
    }

    const challengeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabaseAdmin
      .from('duels')
      .insert({
        challenger_id: challenger.id,
        defender_id: defender.id,
        challenger_character: challenger.character_name,
        defender_character: defender.character_name,
        challenger_character_slug: challenger.character_match_id,
        defender_character_slug: defender.character_match_id,
        challenger_faction: challenger.faction,
        defender_faction: defender.faction,
        challenge_message: message?.trim() || null,
        status: 'pending',
        current_round: 0,
        challenger_max_hp: computeDuelMaxHp(challenger.character_match_id),
        defender_max_hp: computeDuelMaxHp(defender.character_match_id),
        challenger_hp: computeDuelMaxHp(challenger.character_match_id),
        defender_hp: computeDuelMaxHp(defender.character_match_id),
        challenge_expires_at: challengeExpiresAt,
      })
      .select(DUEL_SELECT)
      .single()

    if (error || !data) {
      return { error: error?.message ?? 'Unable to file the duel challenge.' as const }
    }

    await supabaseAdmin.from('notifications').insert({
      user_id: defender.id,
      type: 'duel_challenge',
      message: `${duelIdentityLabel(challenger)} has issued a challenge. You have 24 hours to respond.`,
      reference_id: data.id,
      action_url: '/duels/inbox',
      payload: {
        duel_id: data.id,
        challenger_id: challenger.id,
        challenger_name: challenger.username,
        challenger_character: challenger.character_name,
        expires_at: challengeExpiresAt,
      },
    })
    try {
      await invalidateNotificationsCache(defender.id)
    } catch (err) {
      console.error('[notifications] invalidate error', err)
    }

    return { data: normalizeDuel(data as Duel) }
  },

  async createBotChallenge(challenger: DuelParticipant, defender: DuelParticipant, message?: string) {
    // Lightweight challenge creation for bot defenders. Skips role/faction checks.
    await this.expirePendingChallengesForUsers([challenger.id, defender.id])

    const existing = await this.getExistingPairDuel(challenger.id, defender.id)
    if (existing) {
      return { error: 'A registry duel already exists between these operatives.' as const }
    }

    const challengerPendingCount = await this.getPendingOrActiveCount(challenger.id)
    if (challengerPendingCount >= PENDING_DUEL_LIMIT) {
      return { error: 'You already have too many active or pending duels on file.' as const }
    }

    const challengeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabaseAdmin
      .from('duels')
      .insert({
        challenger_id: challenger.id,
        defender_id: defender.id,
        challenger_character: challenger.character_name,
        defender_character: defender.character_name,
        challenger_character_slug: challenger.character_match_id,
        defender_character_slug: defender.character_match_id,
        challenger_faction: challenger.faction,
        defender_faction: defender.faction,
        challenge_message: message?.trim() || null,
        status: 'pending',
        current_round: 0,
        challenger_max_hp: computeDuelMaxHp(challenger.character_match_id),
        defender_max_hp: computeDuelMaxHp(defender.character_match_id),
        challenger_hp: computeDuelMaxHp(challenger.character_match_id),
        defender_hp: computeDuelMaxHp(defender.character_match_id),
        challenge_expires_at: challengeExpiresAt,
      })
      .select(DUEL_SELECT)
      .single()

    if (error || !data) {
      return { error: error?.message ?? 'Unable to file the duel challenge.' as const }
    }

    await supabaseAdmin.from('notifications').insert({
      user_id: defender.id,
      type: 'duel_challenge',
      message: `${duelIdentityLabel(challenger)} has issued a challenge. You have 24 hours to respond.`,
      reference_id: data.id,
      action_url: '/duels/inbox',
      payload: {
        duel_id: data.id,
        challenger_id: challenger.id,
        challenger_name: challenger.username,
        challenger_character: challenger.character_name,
        expires_at: challengeExpiresAt,
      },
    })
    try {
      await invalidateNotificationsCache(defender.id)
    } catch (err) {
      console.error('[notifications] invalidate error', err)
    }

    return { data: normalizeDuel(data as Duel) }
  },

  async getDuelById(duelId: string) {
    const { data } = await supabaseAdmin.from('duels').select(DUEL_SELECT).eq('id', duelId).maybeSingle()
    return data ? normalizeDuel(data as Duel) : null
  },

  async acceptChallenge(duel: Duel) {
    const acceptedAt = new Date().toISOString()
    const roundDeadline = new Date(Date.now() + DUEL_ROUND_DURATION_MS).toISOString()

    const { data, error } = await supabaseAdmin
      .from('duels')
      .update({
        status: 'active',
        accepted_at: acceptedAt,
        current_round: 1,
      })
      .eq('id', duel.id)
      .eq('status', 'pending')
      .select(DUEL_SELECT)
      .single()

    if (error || !data) {
      return { error: error?.message ?? 'Unable to activate this duel.' as const }
    }

    await supabaseAdmin.from('duel_rounds').insert({
      duel_id: duel.id,
      round_number: 1,
      round_started_at: acceptedAt,
      round_deadline: roundDeadline,
    })

    await supabaseAdmin.from('notifications').insert({
      user_id: duel.challenger_id,
      type: 'duel_accepted',
      message: `${duel.defender_character ?? `${duel.defender_faction} operative`} has accepted your challenge. Round 1 begins now.`,
      reference_id: duel.id,
      action_url: `/duels/${duel.id}`,
      payload: {
        duel_id: duel.id,
        round_number: 1,
      },
    })
    try { await invalidateNotificationsCache(duel.challenger_id) } catch (err) { console.error('[notifications] invalidate error', err) }

    return { data: normalizeDuel(data as Duel) }
  },

  async declineChallenge(duelId: string, reason?: string) {
    const { data, error } = await supabaseAdmin
      .from('duels')
      .update({
        status: 'declined',
        decline_reason: reason?.trim() || null,
      })
      .eq('id', duelId)
      .eq('status', 'pending')
      .select(DUEL_SELECT)
      .single()

    if (error || !data) {
      return { error: error?.message ?? 'Unable to decline the challenge.' as const }
    }

    await supabaseAdmin.from('notifications').insert({
      user_id: data.challenger_id,
      type: 'duel_declined',
      message: 'Your challenge was declined. The registry notes this outcome.',
      reference_id: data.id,
      action_url: '/duels',
      payload: {
        duel_id: data.id,
      },
    })
    try { await invalidateNotificationsCache(data.challenger_id) } catch (err) { console.error('[notifications] invalidate error', err) }

    return { data: normalizeDuel(data as Duel) }
  },

  async withdrawChallenge(duelId: string) {
    const { data, error } = await supabaseAdmin
      .from('duels')
      .update({ status: 'cancelled' })
      .eq('id', duelId)
      .eq('status', 'pending')
      .select(DUEL_SELECT)
      .single()

    if (error || !data) {
      return { error: error?.message ?? 'Unable to withdraw the challenge.' as const }
    }

    return { data: normalizeDuel(data as Duel) }
  },

  async getInbox(userId: string) {
    await this.expirePendingChallengesForUsers([userId])

    const now = new Date().toISOString()
    const [incoming, outgoing] = await Promise.all([
      supabaseAdmin
        .from('duels')
        .select(DUEL_SELECT)
        .eq('defender_id', userId)
        .eq('status', 'pending')
        .gt('challenge_expires_at', now)
        .order('created_at', { ascending: false })
        .limit(20),
      supabaseAdmin
        .from('duels')
        .select(DUEL_SELECT)
        .eq('challenger_id', userId)
        .eq('status', 'pending')
        .gt('challenge_expires_at', now)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    return {
      incoming: ((incoming.data as Duel[] | null) ?? []).map(normalizeDuel),
      outgoing: ((outgoing.data as Duel[] | null) ?? []).map(normalizeDuel),
    }
  },

  async getActiveForUser(userId: string) {
    await this.expirePendingChallengesForUsers([userId])

    const { data } = await supabaseAdmin
      .from('duels')
      .select(DUEL_SELECT)
      .or(`challenger_id.eq.${userId},defender_id.eq.${userId}`)
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false })
      .limit(20)

    return ((data as Duel[] | null) ?? []).map(normalizeDuel)
  },

  async searchOpponents(userId: string, faction: string, query: string) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, role, faction, character_name, character_match_id, rank, duel_wins, duel_losses')
      .neq('id', userId)
      .neq('faction', faction)
      .in('role', ['member', 'mod'])
      .in('faction', ['agency', 'mafia', 'guild', 'hunting_dogs', 'special_div'])
      .ilike('username', `%${query}%`)
      .order('username', { ascending: true })
      .limit(8)

    if (error && (error.message.includes('duel_wins') || error.message.includes('duel_losses'))) {
      const fallback = await supabaseAdmin
        .from('profiles')
        .select(PARTICIPANT_SELECT_BASE)
        .neq('id', userId)
        .neq('faction', faction)
        .in('role', ['member', 'mod'])
        .in('faction', ['agency', 'mafia', 'guild', 'hunting_dogs', 'special_div'])
        .ilike('username', `%${query}%`)
        .order('username', { ascending: true })
        .limit(8)

      return ((fallback.data as DuelParticipant[] | null) ?? []).map((entry) => ({
        ...entry,
        duel_wins: 0,
        duel_losses: 0,
      }))
    }

    return (data as DuelParticipant[] | null) ?? []
  },

  async getOpenChallenges(viewerId: string, viewerFaction: string | null) {
    const { data } = await supabaseAdmin
      .from('open_challenges')
      .select(OPEN_CHALLENGE_SELECT)
      .eq('status', 'open')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(20)

    const rows = ((data as OpenChallenge[] | null) ?? []).map(normalizeOpenChallenge)
    return viewerFaction ? rows.filter((row) => row.faction !== viewerFaction || row.challenger_id === viewerId) : rows
  },

  async createOpenChallenge(challenger: DuelParticipant, message?: string) {
    const existing = await supabaseAdmin
      .from('open_challenges')
      .select('id')
      .eq('challenger_id', challenger.id)
      .eq('status', 'open')
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle()

    if (existing.data) {
      return { error: 'You already have an open challenge on the board.' as const }
    }

    const { data, error } = await supabaseAdmin
      .from('open_challenges')
      .insert({
        challenger_id: challenger.id,
        faction: challenger.faction,
        character_name: challenger.character_name,
        message: message?.trim() || null,
        status: 'open',
      })
      .select(OPEN_CHALLENGE_SELECT)
      .single()

    if (error || !data) {
      return { error: error?.message ?? 'Unable to post the open challenge.' as const }
    }

    return { data: normalizeOpenChallenge(data as OpenChallenge) }
  },

  async withdrawOpenChallenge(userId: string, openChallengeId: string) {
    const { data, error } = await supabaseAdmin
      .from('open_challenges')
      .update({ status: 'withdrawn' })
      .eq('id', openChallengeId)
      .eq('challenger_id', userId)
      .eq('status', 'open')
      .select(OPEN_CHALLENGE_SELECT)
      .single()

    if (error || !data) {
      return { error: error?.message ?? 'Unable to withdraw the open challenge.' as const }
    }

    return { data: normalizeOpenChallenge(data as OpenChallenge) }
  },

  async acceptOpenChallenge(openChallengeId: string, defender: DuelParticipant) {
    const { data: challenge } = await supabaseAdmin
      .from('open_challenges')
      .select(OPEN_CHALLENGE_SELECT)
      .eq('id', openChallengeId)
      .eq('status', 'open')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    const openChallenge = (challenge as OpenChallenge | null) ?? null

    if (!openChallenge) {
      return { error: 'This open challenge is no longer available.' as const }
    }

    const challenger = await this.getParticipant(openChallenge.challenger_id)
    if (!challenger) {
      return { error: 'The challenger record is missing.' as const }
    }

    const created = await this.createChallenge(challenger, defender, openChallenge.message ?? undefined)
    if ('error' in created) {
      return created
    }

    await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', defender.id)
      .eq('type', 'duel_challenge')
      .eq('reference_id', created.data.id)

    const accepted = await this.acceptChallenge(created.data)
    if ('error' in accepted) {
      return accepted
    }

    await supabaseAdmin
      .from('open_challenges')
      .update({
        status: 'accepted',
        accepted_by: defender.id,
        duel_id: accepted.data.id,
      })
      .eq('id', openChallengeId)

    return { data: accepted.data }
  },
}
