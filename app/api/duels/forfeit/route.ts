import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { DuelModel } from '@/backend/models/duel.model'

const ForfeitSchema = z.object({
    duel_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
    const auth = await requireAuth(request)
    if (isNextResponse(auth)) return auth

    const body = await request.json().catch(() => null)
    const parsed = ForfeitSchema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid forfeit payload.' }, { status: 400 })
    }

    const duel = await DuelModel.getDuelById(parsed.data.duel_id)
    if (!duel) {
        return NextResponse.json({ error: 'Duel not found.' }, { status: 404 })
    }

    const isParticipant = duel.challenger_id === auth.user.id || duel.defender_id === auth.user.id
    if (!isParticipant) {
        return NextResponse.json({ error: 'You are not a participant in this duel.' }, { status: 403 })
    }

    if (duel.status !== 'active') {
        return NextResponse.json({ error: 'Only active duels can be forfeited.' }, { status: 400 })
    }

    const result = await DuelModel.forfeitDuel(duel.id, auth.user.id)
    if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
}
