import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { supabaseAdmin } from '@/backend/lib/supabase'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (isNextResponse(auth)) {
    return auth
  }

  await supabaseAdmin
    .from('profiles')
    .update({ guide_bot_dismissed: true })
    .eq('id', auth.user.id)

  return NextResponse.json({ success: true })
}
