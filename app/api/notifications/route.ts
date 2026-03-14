import { NextRequest, NextResponse } from 'next/server'
import { requireUserId, isNextResponse } from '@/backend/middleware/auth'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { getNotificationsCache, setNotificationsCache } from '@/backend/lib/notifications-cache'
import type { Notification } from '@/backend/types'

type NotificationRow = Notification & {
  action_url?: string | null
  reference_id?: string | null
  read_at?: string | null
}

export async function GET(request: NextRequest) {
  const userId = await requireUserId(request)
  if (isNextResponse(userId)) return userId

  const limit = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get('limit') ?? '10') || 10, 1),
    20,
  )

  // 1. Try cache first
  try {
    const cached = await getNotificationsCache(userId, limit)
    if (cached) {
      return NextResponse.json({ data: cached })
    }
  } catch (err) {
    console.error('[notifications] cache get failed', err)
  }

  // 2. Fetch from database
  // Improved: Attempt latest schema columns first, but handle failure gracefully
  let { data, error } = await supabaseAdmin
    .from('notifications')
    .select('id, user_id, type, message, payload, action_url, reference_id, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  // Fallback if schema columns like read_at are missing
  if (error && (error.message.includes('column') || error.message.includes('read_at'))) {
    const fallback = await supabaseAdmin
      .from('notifications')
      .select('id, user_id, type, message, payload, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    data = fallback.data as any
    error = fallback.error
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const rows = (data as NotificationRow[] ?? []).map((row) => ({
    ...row,
    action_url: row.action_url ?? null,
    reference_id: row.reference_id ?? null,
    read_at: row.read_at ?? null,
  }))

  // 3. Prime cache aggressively
  try {
    // If we fetched 20, we can satisfy both limit=10 and limit=20 requests from cache
    if (limit === 20) {
      await Promise.all([
        setNotificationsCache(userId, 20, rows),
        setNotificationsCache(userId, 10, rows.slice(0, 10)),
      ])
    } else {
      await setNotificationsCache(userId, limit, rows)
    }
  } catch (err) {
    console.warn('[notifications] cache prime failed', err)
  }

  return NextResponse.json({ data: rows })
}
