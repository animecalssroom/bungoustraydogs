import { supabaseAdmin } from '@/backend/lib/supabase'
import type { ArenaArgument, ArenaDebate, ArenaVote, Profile } from '@/backend/types'

const ARENA_SELECT = 'id, week, question, fighter_a_id, fighter_b_id, title_a, title_b, topic, content_a, content_b, votes_a, votes_b, is_active, ends_at, created_at'

export const ArenaModel = {
  async getActive(): Promise<ArenaDebate[]> {
    const { data } = await supabaseAdmin
      .from('arena_debates').select(ARENA_SELECT).eq('is_active', true).order('created_at', { ascending: false })
    return data ?? []
  },
  
  async getById(id: string): Promise<ArenaDebate | null> {
    const { data } = await supabaseAdmin
      .from('arena_debates').select(ARENA_SELECT).eq('id', id).single()

    return data
  },
  
  async getUserVote(debateId: string, userId: string): Promise<ArenaVote | null> {
    const { data } = await supabaseAdmin
      .from('arena_votes').select('id, debate_id, user_id, side, created_at')
      .eq('debate_id', debateId).eq('user_id', userId).single()
    return data
  },

  async getUserVotes(debateIds: string[], userId: string): Promise<Record<string, 'a' | 'b'>> {
    if (debateIds.length === 0) {
      return {}
    }

    const { data } = await supabaseAdmin
      .from('arena_votes')
      .select('debate_id, side')
      .in('debate_id', debateIds)
      .eq('user_id', userId)

    return (data ?? []).reduce<Record<string, 'a' | 'b'>>((summary, vote) => {
      if (vote.debate_id && (vote.side === 'a' || vote.side === 'b')) {
        summary[vote.debate_id] = vote.side
      }
      return summary
    }, {})
  },

  async getArguments(debateId: string, limit = 12): Promise<ArenaArgument[]> {
    const { data } = await supabaseAdmin
      .from('arena_arguments')
      .select('id, debate_id, user_id, faction, content, created_at')
      .eq('debate_id', debateId)
      .order('created_at', { ascending: false })
      .limit(limit)

    const rows = (data ?? []) as ArenaArgument[]
    if (rows.length === 0) {
      return []
    }

    const authorIds = Array.from(new Set(rows.map((row) => row.user_id)))
    const { data: authors } = await supabaseAdmin
      .from('profiles')
      .select('id, username, character_match_id, rank, faction')
      .in('id', authorIds)

    const authorMap = ((authors ?? []) as Pick<
      Profile,
      'id' | 'username' | 'character_match_id' | 'rank' | 'faction'
    >[]).reduce<Record<string, Pick<Profile, 'username' | 'character_match_id' | 'rank' | 'faction'>>>(
      (summary, author) => {
        summary[author.id] = {
          username: author.username,
          character_match_id: author.character_match_id,
          rank: author.rank,
          faction: author.faction,
        }
        return summary
      },
      {},
    )

    return rows
      .reverse()
      .map((row) => ({
        ...row,
        author: authorMap[row.user_id] ?? null,
      }))
  },

  async createArgument(
    debateId: string,
    user: Pick<Profile, 'id' | 'faction'>,
    content: string,
  ): Promise<ArenaArgument | null> {
    const { data, error } = await supabaseAdmin
      .from('arena_arguments')
      .insert({
        debate_id: debateId,
        user_id: user.id,
        faction: user.faction,
        content,
      })
      .select('id, debate_id, user_id, faction, content, created_at')
      .single()

    if (error || !data) {
      return null
    }

    const { data: author } = await supabaseAdmin
      .from('profiles')
      .select('username, character_match_id, rank, faction')
      .eq('id', user.id)
      .maybeSingle()

    return {
      ...(data as ArenaArgument),
      author: (author as ArenaArgument['author']) ?? null,
    }
  },

  async getPayload(userId?: string | null) {
    const debates = await this.getActive()
    const debateIds = debates.map((debate) => debate.id)
    const voted = userId ? await this.getUserVotes(debateIds, userId) : {}
    const argumentsByDebate = Object.fromEntries(
      await Promise.all(
        debates.map(async (debate) => [debate.id, await this.getArguments(debate.id)]),
      ),
    )

    let canVote = false

    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

      canVote = ['member', 'mod', 'owner'].includes(profile?.role ?? '')
    }

    return {
      debates,
      voted,
      argumentsByDebate,
      canVote,
    }
  },
  
  async vote(debateId: string, userId: string, side: 'a' | 'b'): Promise<boolean> {
    const existing = await this.getUserVote(debateId, userId)
    if (existing) return false
    
    const { error } = await supabaseAdmin
      .from('arena_votes').insert({ debate_id: debateId, user_id: userId, side })
    if (error) return false
    
    const col = side === 'a' ? 'votes_a' : 'votes_b'
    await supabaseAdmin.rpc('increment_vote', { debate_id: debateId, col })
    return true
  },
}
