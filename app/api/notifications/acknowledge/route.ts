import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { supabaseAdmin } from '@/backend/lib/supabase'

const AcknowledgeSchema = z.object({
  id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  const body = await request.json().catch(() => null)
  const parsed = AcknowledgeSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid notification payload.' }, { status: 400 })
  }

  const timestamp = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .update({ read_at: timestamp })
    .eq('id', parsed.data.id)
    .eq('user_id', auth.user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Notification not found.' }, { status: 404 })
  }

  return NextResponse.json({ data: { ...data, read_at: timestamp } })
}
