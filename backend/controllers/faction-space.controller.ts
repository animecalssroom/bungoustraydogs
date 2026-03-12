import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { FactionSpaceModel } from '@/backend/models/faction-space.model'
import { UserModel } from '@/backend/models/user.model'
import type { FactionId, Profile } from '@/backend/types'

function canAccessFactionSpace(profile: Profile, factionId: FactionId) {
  if (profile.role === 'owner') return true
  if (profile.role !== 'member' && profile.role !== 'mod') return false
  return profile.faction === factionId
}

function invalidFactionResponse() {
  return NextResponse.json({ error: 'Faction not found' }, { status: 404 })
}

function forbiddenFactionResponse() {
  return NextResponse.json(
    { error: 'You do not have clearance for this faction space' },
    { status: 403 },
  )
}

export const FactionSpaceController = {
  async getSpace(req: NextRequest, factionId: FactionId) {
    const auth = await requireAuth(req)

    if (isNextResponse(auth)) return auth
    if (!canAccessFactionSpace(auth.profile, factionId)) {
      return forbiddenFactionResponse()
    }

    const space = await FactionSpaceModel.getSpace(factionId)

    if (!space) {
      return invalidFactionResponse()
    }

    return NextResponse.json({ data: space })
  },

  async getMessages(req: NextRequest, factionId: FactionId) {
    const auth = await requireAuth(req)

    if (isNextResponse(auth)) return auth
    if (!canAccessFactionSpace(auth.profile, factionId)) {
      return forbiddenFactionResponse()
    }

    const messages = await FactionSpaceModel.getMessages(factionId)
    return NextResponse.json({ data: messages })
  },

  async postMessage(req: NextRequest, factionId: FactionId) {
    const auth = await requireAuth(req)

    if (isNextResponse(auth)) return auth
    if (!canAccessFactionSpace(auth.profile, factionId)) {
      return forbiddenFactionResponse()
    }

    const body = (await req.json().catch(() => null)) as
      | { content?: unknown }
      | null

    const content =
      typeof body?.content === 'string' ? body.content.trim() : ''

    if (content.length < 1 || content.length > 500) {
      return NextResponse.json(
        { error: 'Messages must be between 1 and 500 characters' },
        { status: 400 },
      )
    }

    const message = await FactionSpaceModel.createMessage(
      auth.user.id,
      factionId,
      content,
    )

    if (!message) {
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 },
      )
    }

    await UserModel.addAp(auth.user.id, 'faction_event', 0, {
      source: 'transmission',
      faction: factionId,
      duel_style: 'stance',
    })

    return NextResponse.json({ data: message }, { status: 201 })
  },
}
