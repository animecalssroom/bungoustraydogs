import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { sanitizeMultilineText, sanitizePlainText } from '@/backend/lib/input-safety'
import { supabaseAdmin } from '@/backend/lib/supabase'
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

const CASE_INITIALS: Record<FactionId, string> = {
  agency: 'A',
  mafia: 'M',
  guild: 'G',
  hunting_dogs: 'D',
  special_div: 'S',
  rats: 'R',
  decay: 'X',
  clock_tower: 'C',
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
      typeof body?.content === 'string'
        ? sanitizePlainText(body.content)
        : ''

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

    await UserModel.addAp(auth.user.id, 'chat_message', 2, {
      source: 'transmission',
      faction: factionId,
    })

    return NextResponse.json({ data: message }, { status: 201 })
  },

  async postBulletin(req: NextRequest, factionId: FactionId) {
    const auth = await requireAuth(req)

    if (isNextResponse(auth)) return auth
    if (!canAccessFactionSpace(auth.profile, factionId)) {
      return forbiddenFactionResponse()
    }

    if (!(auth.profile.role === 'owner' || (auth.profile.role === 'mod' && auth.profile.faction === factionId))) {
      return NextResponse.json({ error: 'Only moderators can post bulletins.' }, { status: 403 })
    }

    const body = (await req.json().catch(() => null)) as
      | { content?: unknown; pinned?: unknown }
      | null

    const content =
      typeof body?.content === 'string'
        ? sanitizeMultilineText(body.content)
        : ''

    if (content.length < 1 || content.length > 1200) {
      return NextResponse.json(
        { error: 'Bulletins must be between 1 and 1200 characters' },
        { status: 400 },
      )
    }

    const { count } = await supabaseAdmin
      .from('faction_bulletins')
      .select('id', { count: 'exact', head: true })
      .eq('faction_id', factionId)

    const caseNumber = `YKH-${CASE_INITIALS[factionId]}-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(3, '0')}`

    const bulletin = await FactionSpaceModel.createBulletin({
      userId: auth.user.id,
      factionId,
      content,
      pinned: body?.pinned === true,
      authorCharacter: auth.profile.character_name ?? auth.profile.username,
      caseNumber,
    })

    if (!bulletin) {
      return NextResponse.json({ error: 'Failed to post bulletin' }, { status: 500 })
    }

    await UserModel.addAp(auth.user.id, 'bulletin_post', 3, {
      faction: factionId,
      case_number: bulletin.case_number,
      pinned: bulletin.pinned,
    })

    return NextResponse.json({ data: bulletin }, { status: 201 })
  },
}
