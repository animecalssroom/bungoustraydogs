import { NextRequest, NextResponse } from 'next/server'
import { FactionModel } from '@/backend/models/faction.model'
import type { FactionId } from '@/backend/types'

export const FactionController = {
  async getAll() {
    const factions = await FactionModel.getAll()
    return NextResponse.json({ data: factions })
  },

  async getById(_req: NextRequest, factionId: FactionId) {
    const faction = await FactionModel.getById(factionId)

    if (!faction) {
      return NextResponse.json({ error: 'Faction not found' }, { status: 404 })
    }

    const [leader, roster, events] = await Promise.all([
      FactionModel.getLeader(factionId),
      FactionModel.getPublicRoster(factionId),
      FactionModel.getRecentEvents(factionId),
    ])

    return NextResponse.json({
      data: {
        faction,
        leader,
        roster,
        recentEvents: events,
      },
    })
  },

  async join() {
    return NextResponse.json(
      {
        error:
          'Direct faction enlistment has been removed. Complete the registry quiz first.',
      },
      { status: 410 },
    )
  },
}
