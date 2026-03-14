import { NextRequest, NextResponse } from 'next/server'
import { CharacterModel } from '@/backend/models/character.model'
import type { FactionId } from '@/backend/types'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { checkAssignmentTrigger } from '@/src/lib/assignment/checkAssignmentTrigger'
import { supabaseAdmin } from '@/backend/lib/supabase'

export const CharacterController = {
  async getAll(req: NextRequest) {
    const faction = req.nextUrl.searchParams.get('faction') as FactionId | null
    const characters = await CharacterModel.getAll(faction ?? undefined)
    return NextResponse.json({ data: characters })
  },
  
  async getBySlug(slug: string) {
    const character = await CharacterModel.getBySlug(slug)
    if (!character) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: character })
  },

  async assignMine(req: NextRequest) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    await checkAssignmentTrigger(auth.user.id)

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('character_name, character_match_id')
      .eq('id', auth.user.id)
      .single()

    if (!profile || !profile.character_match_id) {
      const { count } = await supabaseAdmin.from('user_events').select('*', { count: 'exact', head: true }).eq('user_id', auth.user.id).in('event_type', ['daily_login', 'chat_message', 'archive_read', 'lore_post', 'duel_complete', 'arena_vote'])

      return NextResponse.json(
        {
          error: 'Character assignment is not available yet.',
          data: {
            eventCount: count ?? 0,
            threshold: 10,
            requirements: ['10 qualifying events combined (logins, archive reads, chats, duels, votes, lore)'],
          },
        },
        { status: 409 },
      )
    }

    return NextResponse.json({ data: profile })
  },
}
