import { NextRequest, NextResponse } from 'next/server'
import { CharacterModel } from '@/backend/models/character.model'
import type { FactionId } from '@/backend/types'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { CharacterAssignmentModel } from '@/backend/models/character-assignment.model'

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

    const result = await CharacterAssignmentModel.assignIfEligible(auth.user.id)

    if (!result) {
      const eventCount = await CharacterAssignmentModel.getEventCount(auth.user.id)

      return NextResponse.json(
        {
            error: 'Character assignment is not available yet.',
          data: {
            eventCount,
            threshold: 20,
            requirements: [
              '20 qualifying non-login events, or 10 with overwhelming trait dominance',
              'At least 1 arena vote',
              'At least 1 lore or transmission signal',
              'At least 3 active participation events total',
            ],
          },
        },
        { status: 409 },
      )
    }

    return NextResponse.json({ data: result })
  },
}
