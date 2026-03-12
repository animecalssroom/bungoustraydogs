import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { validate } from '@/backend/middleware/validate'
import { AP_VALUES } from '@/backend/types'
import { UserModel } from '@/backend/models/user.model'

const BehaviorEventSchema = z.object({
  eventType: z.enum([
    'daily_login',
    'login_streak',
    'debate_upvote',
    'faction_event',
    'easter_egg',
    'join_faction',
    'save_lore',
    'write_lore',
    'feed_view',
    'profile_view',
    'archive_read',
    'archive_view',
    'faction_checkin',
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const BehaviorController = {
  async dailyLogin(req: NextRequest) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    const result = await UserModel.claimDailyLogin(auth.user.id)

    if (!result) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
    }

    return NextResponse.json({ data: result })
  },

  async update(req: NextRequest) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    const body = await req.json().catch(() => ({}))
    const parsed = validate(BehaviorEventSchema, body)

    if (!parsed.success) {
      return parsed.response
    }

    if (
      parsed.data.eventType === 'daily_login' ||
      parsed.data.eventType === 'login_streak'
    ) {
      return NextResponse.json(
        { error: 'Daily login now uses /api/behavior/daily-login.' },
        { status: 410 },
      )
    }

    await UserModel.addAp(
      auth.user.id,
      parsed.data.eventType,
      AP_VALUES[parsed.data.eventType],
      parsed.data.metadata ?? {},
    )

    return NextResponse.json({
      data: {
        success: true,
        eventType: parsed.data.eventType,
        apAwarded: AP_VALUES[parsed.data.eventType],
      },
    })
  },
}
