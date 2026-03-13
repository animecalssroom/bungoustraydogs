import { NextRequest, NextResponse } from 'next/server'
import { verifyBotSecret } from '@/src/lib/bots/bot-utils'

export async function POST(request: NextRequest) {
  if (!verifyBotSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => null)
    if (!body?.botUsername) {
      return NextResponse.json({ error: 'Missing botUsername' }, { status: 400 })
    }

    // Minimal verify helper: in future this will validate and return bot profile info.
    return NextResponse.json({ success: true, verified: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
