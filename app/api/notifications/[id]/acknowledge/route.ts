import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { invalidateNotificationsCache } from '@/backend/lib/notifications-cache'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  const timestamp = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .update({ read_at: timestamp })
    .eq('id', params.id)
    .eq('user_id', auth.user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Notification not found.' }, { status: 404 })
  }

  try { await invalidateNotificationsCache(auth.user.id) } catch (err) { console.error('[notifications] invalidate error', err) }

  return NextResponse.json({ data: { ...data, read_at: timestamp } })
}
