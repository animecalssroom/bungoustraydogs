import { NextResponse } from 'next/server'
import { FactionWarModel } from '@/backend/models/faction-war.model'

export async function GET(req: Request) {
  // Simple check for auth (optional, but recommended)
  // const authHeader = req.headers.get('authorization')
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // }

  try {
    const activeWars = await FactionWarModel.getActiveWars()
    if (activeWars.length === 0) {
      return NextResponse.json({ message: 'No active wars' })
    }

    const results = []

    for (const war of activeWars) {
      const now = new Date()
      const endsAt = new Date(war.ends_at!)
      const day3At = new Date(war.day3_at!)
      const day2At = new Date(war.day2_at!)

      if (now >= endsAt) {
        await FactionWarModel.resolveWar(war.id)
        results.push({ war_id: war.id, action: 'resolved' })
        continue
      }

      if (now >= day3At && war.status === 'day2') {
        await FactionWarModel.transitionToDay(war.id, 'day3')
        results.push({ war_id: war.id, action: 'transitioned_to_day3' })
        continue
      }

      if (now >= day2At && war.status === 'active') {
        await FactionWarModel.transitionToDay(war.id, 'day2')
        results.push({ war_id: war.id, action: 'transitioned_to_day2' })
        continue
      }

      // Always sync integrity state for permanence
      await FactionWarModel.syncWarState(war.id)
      results.push({ war_id: war.id, action: 'synced_integrity' })
    }

    return NextResponse.json({ message: 'Cron cycle complete', results })
  } catch (error: any) {
    console.error('[WarCron] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
