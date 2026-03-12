import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { supabaseAdmin } from '@/backend/lib/supabase'

function canInspectSpecial(authProfile: { role: string; faction: string | null }) {
  return authProfile.role === 'mod' && authProfile.faction === 'special_div'
}

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const auth = await requireAuth(req)
  if (isNextResponse(auth)) return auth

  if (!canInspectSpecial(auth.profile)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data } = await supabaseAdmin
    .from('profiles')
    .select(
      'id, username, faction, role, rank, ap_total, character_name, character_match_id, behavior_scores',
    )
    .eq('id', params.userId)
    .maybeSingle()

  if (!data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ data })
}
