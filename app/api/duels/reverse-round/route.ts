import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { DuelModel } from '@/backend/models/duel.model'
import { supabaseAdmin } from '@/backend/lib/supabase'

const ReverseSchema = z.object({
  duel_id: z.string().uuid(),
  round_number: z.number().int().positive(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  const body = await request.json().catch(() => null)
  const parsed = ReverseSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid reversal payload.' }, { status: 400 })
  }

  const duel = await DuelModel.getDuelById(parsed.data.duel_id)
  if (!duel || (duel.challenger_id !== auth.user.id && duel.defender_id !== auth.user.id && auth.profile.role !== 'owner')) {
    return NextResponse.json({ error: 'You cannot reverse this round.' }, { status: 403 })
  }

  const { data: round } = await supabaseAdmin
    .from('duel_rounds')
    .select('id, reversal_available, reversal_used')
    .eq('duel_id', duel.id)
    .eq('round_number', parsed.data.round_number)
    .maybeSingle()

  if (!round?.reversal_available || round.reversal_used) {
    return NextResponse.json({ error: 'No reversal window is available for this round.' }, { status: 400 })
  }

  return NextResponse.json(
    { error: 'Round reversal wiring is not fully enabled in this pass yet.' },
    { status: 501 },
  )
}
