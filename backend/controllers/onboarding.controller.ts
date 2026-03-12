import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { OnboardingModel } from '@/backend/models/onboarding.model'
import { UserModel } from '@/backend/models/user.model'
import { AP_VALUES } from '@/backend/types'
import {
  createCaseNumber,
  FACTION_META,
  getCharacterReveal,
} from '@/frontend/lib/launch'

export const OnboardingController = {
  async start(req: NextRequest) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    return NextResponse.json(
      { error: 'The quiz now submits once at the end. Use /api/quiz/submit.' },
      { status: 410 },
    )
  },

  async answer(req: NextRequest) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    return NextResponse.json(
      { error: 'The quiz now submits once at the end. Use /api/quiz/submit.' },
      { status: 410 },
    )
  },

  async result(req: NextRequest) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    if (!auth.profile.quiz_completed) {
      return NextResponse.json(
        { error: 'The registry requires all seven answers first.' },
        { status: 409 },
      )
    }

    const factionMeta = auth.profile.faction
      ? FACTION_META[auth.profile.faction]
      : null

    return NextResponse.json({
      data: {
        caseNumber: createCaseNumber(auth.user.id),
        resolution: {
          faction: auth.profile.faction,
          status: auth.profile.exam_status ?? 'unplaceable',
          scores: auth.profile.exam_scores ?? {},
        },
        faction: factionMeta,
      },
    })
  },

  async accept(req: NextRequest) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    if (auth.profile.quiz_locked && auth.profile.quiz_completed) {
      return NextResponse.json(
        { error: 'Assignment has already been accepted' },
        { status: 409 },
      )
    }

    if (!auth.profile.quiz_completed) {
      return NextResponse.json(
        { error: 'The registry requires all seven answers first.' },
        { status: 409 },
      )
    }

    const outcome = await OnboardingModel.accept(auth.user.id)
    if (!outcome) {
      return NextResponse.json({ error: 'No quiz result found' }, { status: 404 })
    }

    if (outcome.faction) {
      await UserModel.addAp(
        auth.user.id,
        'faction_assignment',
        AP_VALUES.faction_assignment,
        {
          faction: outcome.faction,
          outcome: outcome.outcome,
        },
      )
    }

    if (outcome.outcome === 'member') {
      await UserModel.addAp(auth.user.id, 'quiz_complete', AP_VALUES.quiz_complete, {
        faction: outcome.faction,
      })
    }

    return NextResponse.json({
      data: {
        ...outcome,
        factionId: outcome.faction,
        faction: outcome.faction ? FACTION_META[outcome.faction] : null,
        character: getCharacterReveal(outcome.characterId),
      },
    })
  },
}
