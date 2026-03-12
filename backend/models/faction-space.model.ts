import { supabaseAdmin } from '@/backend/lib/supabase'
import { FactionModel } from '@/backend/models/faction.model'
import type {
  FactionActivity,
  FactionBulletin,
  FactionId,
  FactionMessage,
  FactionMessageAuthor,
  FactionMemberSummary,
  FactionSpace,
} from '@/backend/types'

type RawFactionMessage = {
  id: string
  faction_id: FactionId
  user_id: string
  sender_character: string | null
  sender_rank: string | null
  content: string
  created_at: string
}

async function loadAuthors(userIds: string[]): Promise<Record<string, FactionMessageAuthor>> {
  if (userIds.length === 0) return {}

  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, username, avatar_url, rank, ap_total, character_match_id')
    .in('id', userIds)

  return (data ?? []).reduce<Record<string, FactionMessageAuthor>>((summary, profile) => {
    summary[profile.id] = {
      id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      rank: profile.rank,
      ap_total: profile.ap_total,
      character_match_id: profile.character_match_id,
    }
    return summary
  }, {})
}

function withAuthors(
  messages: RawFactionMessage[],
  authors: Record<string, FactionMessageAuthor>,
): FactionMessage[] {
  return messages.map((message) => ({
    ...message,
    author: authors[message.user_id] ?? null,
  }))
}

export const FactionSpaceModel = {
  async getSpace(factionId: FactionId): Promise<FactionSpace | null> {
    const faction = await FactionModel.getById(factionId)

    if (!faction) {
      return null
    }

    const [leader, membersResult] = await Promise.all([
      FactionModel.getLeader(factionId),
      supabaseAdmin
        .from('profiles')
        .select('id, username, avatar_url, rank, ap_total, role, faction, character_match_id, behavior_scores, last_seen')
        .eq('faction', factionId)
        .in('role', ['member', 'mod'])
        .order('ap_total', { ascending: false })
        .order('rank', { ascending: false })
        .order('username', { ascending: true }),
    ])

    return {
      faction,
      leader,
      members: (membersResult.data ?? []) as FactionMemberSummary[],
    }
  },

  async getMessages(
    factionId: FactionId,
    limit = 60,
  ): Promise<FactionMessage[]> {
    const { data } = await supabaseAdmin
      .from('faction_messages')
      .select('id, faction_id, user_id, sender_character, sender_rank, content, created_at')
      .eq('faction_id', factionId)
      .order('created_at', { ascending: false })
      .limit(limit)

    const rows = ((data ?? []) as RawFactionMessage[]).reverse()
    const authors = await loadAuthors(
      Array.from(new Set(rows.map((message) => message.user_id))),
    )

    return withAuthors(rows, authors)
  },

  async getBulletins(factionId: FactionId, limit = 10): Promise<FactionBulletin[]> {
    const { data } = await supabaseAdmin
      .from('faction_bulletins')
      .select('*')
      .eq('faction_id', factionId)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    return (data ?? []) as FactionBulletin[]
  },

  async getActivity(factionId: FactionId, limit = 20): Promise<FactionActivity[]> {
    const { data } = await supabaseAdmin
      .from('faction_activity')
      .select('*')
      .eq('faction_id', factionId)
      .order('created_at', { ascending: false })
      .limit(limit)

    return (data ?? []) as FactionActivity[]
  },

  async createMessage(
    userId: string,
    factionId: FactionId,
    content: string,
  ): Promise<FactionMessage | null> {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('character_name, username, rank')
      .eq('id', userId)
      .maybeSingle()

    const { data, error } = await supabaseAdmin
      .from('faction_messages')
      .insert({
        user_id: userId,
        faction_id: factionId,
        sender_character: profile?.character_name ?? profile?.username ?? 'Unknown File',
        sender_rank: typeof profile?.rank === 'number' ? `R${profile.rank}` : null,
        content,
      })
      .select('id, faction_id, user_id, sender_character, sender_rank, content, created_at')
      .single()

    if (error || !data) {
      return null
    }

    const authors = await loadAuthors([userId])
    return withAuthors([data as RawFactionMessage], authors)[0] ?? null
  },

  async createBulletin(input: {
    userId: string
    factionId: FactionId
    content: string
    pinned?: boolean
    authorCharacter?: string | null
    caseNumber?: string | null
  }): Promise<FactionBulletin | null> {
    const { data, error } = await supabaseAdmin
      .from('faction_bulletins')
      .insert({
        faction_id: input.factionId,
        author_id: input.userId,
        author_character: input.authorCharacter ?? null,
        case_number: input.caseNumber ?? null,
        content: input.content,
        pinned: input.pinned ?? false,
      })
      .select('*')
      .single()

    if (error || !data) {
      return null
    }

    return data as FactionBulletin
  },
}
