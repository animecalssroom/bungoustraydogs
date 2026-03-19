import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { DuelModel } from '@/backend/models/duel.model'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (query.length < 2) {
    return NextResponse.json({ data: [] })
  }

  const results = await DuelModel.searchOpponents(auth.user.id, auth.profile.faction ?? '', query)
  return NextResponse.json({ data: results })
}

