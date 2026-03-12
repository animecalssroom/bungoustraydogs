import { NextRequest, NextResponse } from 'next/server'
import { ArenaModel } from '@/backend/models/arena.model'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { UserModel } from '@/backend/models/user.model'
import { AP_VALUES } from '@/backend/types'
import { createClient } from '@/frontend/lib/supabase/server'

export const ArenaController = {
  async getActive() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const payload = await ArenaModel.getPayload(user?.id ?? null)
    return NextResponse.json({ data: payload })
  },
  
  async vote(req: NextRequest, debateId: string) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    if (!['member', 'mod', 'owner'].includes(auth.profile.role)) {
      return NextResponse.json(
        { error: 'Join a faction to vote in the arena.' },
        { status: 403 },
      )
    }
    
    const { side } = await req.json()
    if (side !== 'a' && side !== 'b') {
      return NextResponse.json({ error: 'Invalid side' }, { status: 400 })
    }
    
    const debate = await ArenaModel.getById(debateId)
    if (!debate) return NextResponse.json({ error: 'Debate not found' }, { status: 404 })
    if (!debate.is_active) return NextResponse.json({ error: 'Debate is closed' }, { status: 403 })
    
    const voted = await ArenaModel.vote(debateId, auth.user.id, side)
    if (!voted) return NextResponse.json({ error: 'Already voted' }, { status: 409 })
    
    await UserModel.addAp(auth.user.id, 'arena_vote', AP_VALUES.arena_vote, {
      debate_id: debateId,
      side,
      fighter_a_id: debate.fighter_a_id,
      fighter_b_id: debate.fighter_b_id,
    })
    return NextResponse.json({ data: { success: true } })
  },

  async postArgument(req: NextRequest, debateId: string) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    if (!['member', 'mod', 'owner'].includes(auth.profile.role)) {
      return NextResponse.json(
        { error: 'Join a faction to file an arena argument.' },
        { status: 403 },
      )
    }

    const debate = await ArenaModel.getById(debateId)
    if (!debate || !debate.is_active) {
      return NextResponse.json({ error: 'Debate is closed' }, { status: 404 })
    }

    const body = await req.json().catch(() => null)
    const content = typeof body?.content === 'string' ? body.content.trim() : ''

    if (content.length < 12 || content.length > 600) {
      return NextResponse.json(
        { error: 'Arguments must be between 12 and 600 characters.' },
        { status: 400 },
      )
    }

    const argument = await ArenaModel.createArgument(debateId, auth.profile, content)
    if (!argument) {
      return NextResponse.json(
        { error: 'Failed to file arena argument.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ data: argument }, { status: 201 })
  },
}
