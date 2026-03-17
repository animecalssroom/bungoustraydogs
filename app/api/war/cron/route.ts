import { NextResponse } from 'next/server'
import { FactionWarModel } from '@/backend/models/faction-war.model'

export async function GET(req: Request) {
  // Simple check for auth (optional, but recommended)
  // const authHeader = req.headers.get('authorization')
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // }

  try {
    const war = await FactionWarModel.getActiveWar()
    if (!war) {
      return NextResponse.json({ message: 'No active war' })
    }

    const now = new Date()
    const endsAt = new Date(war.ends_at!)
    const day3At = new Date(war.day3_at!)
    const day2At = new Date(war.day2_at!)

    if (now >= endsAt) {
      await FactionWarModel.resolveWar(war.id)
      return NextResponse.json({ message: 'War resolved', war_id: war.id })
    }

    if (now >= day3At && war.status === 'day2') {
      await FactionWarModel.transitionToDay(war.id, 'day3')
      return NextResponse.json({ message: 'Transitioned to Day 3', war_id: war.id })
    }

    if (now >= day2At && war.status === 'active') {
      await FactionWarModel.transitionToDay(war.id, 'day2')
      return NextResponse.json({ message: 'Transitioned to Day 2', war_id: war.id })
    }

    // Always sync integrity state for permanence
    await FactionWarModel.syncWarState(war.id)

    return NextResponse.json({ message: 'No action needed', status: war.status })
  } catch (error: any) {
    console.error('[WarCron] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
