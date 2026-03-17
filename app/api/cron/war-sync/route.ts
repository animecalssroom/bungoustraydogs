import { NextRequest, NextResponse } from 'next/server'
import { FactionWarModel } from '@/backend/models/faction-war.model'

export async function GET(request: NextRequest) {
  // Simple check for internal/cron secret if configured
  const authHeader = request.headers.get('authorization')
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // }

  try {
    const result = await FactionWarModel.syncRedisToSupabase()
    return NextResponse.json({ 
      success: true, 
      message: 'War data synchronized successfully.',
      result 
    })
  } catch (error: any) {
    console.error('[CRON_SYNC] Error:', error)
    return NextResponse.json({ error: 'Sync failed: ' + error.message }, { status: 500 })
  }
}
