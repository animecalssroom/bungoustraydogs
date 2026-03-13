import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { supabaseAdmin } from '@/backend/lib/supabase'
import type { Notification } from '@/backend/types'

type NotificationRow = Notification & {
  action_url?: string | null
  reference_id?: string | null
  read_at?: string | null
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  const limit = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get('limit') ?? '10') || 10, 1),
    20,
  )

  const primary = await supabaseAdmin
    .from('notifications')
    .select('id, user_id, type, message, payload, action_url, reference_id, read_at, created_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  const fallback =
    primary.error &&
    (primary.error.message.includes('action_url') ||
      primary.error.message.includes('reference_id') ||
      primary.error.message.includes('read_at'))
      ? await supabaseAdmin
          .from('notifications')
          .select('id, user_id, type, message, payload, created_at')
          .eq('user_id', auth.user.id)
          .order('created_at', { ascending: false })
          .limit(limit)
      : null

  const error = fallback?.error ?? primary.error
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const rows = ((fallback?.data ?? primary.data ?? []) as NotificationRow[]).map((row) => ({
    ...row,
    action_url: row.action_url ?? null,
    reference_id: row.reference_id ?? null,
    read_at: row.read_at ?? null,
  }))

  return NextResponse.json({ data: rows })
}
