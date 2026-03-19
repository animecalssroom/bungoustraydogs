import { NextResponse } from 'next/server'
import { FactionWarModel } from '@/backend/models/faction-war.model'

export async function GET() {
  try {
    const wars = await FactionWarModel.getActiveWars()
    return NextResponse.json({ data: wars })
  } catch (error: any) {
    console.error('[API/WAR/ACTIVE]', error)
    return NextResponse.json({ error: 'Failed to load active war.' }, { status: 500 })
  }
}
