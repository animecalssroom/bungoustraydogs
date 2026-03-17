import { createClient } from '@/frontend/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Profile } from '@/backend/types'

export async function requireAuth(req: NextRequest): Promise<
  { user: { id: string }; profile: Profile } | NextResponse
> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, role, faction, character_match_id, rank')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return { user, profile: profile as unknown as Profile }
}

/**
 * Lighter version of requireAuth that only verifies session and returns user ID.
 * Faster because it skips the profile database lookup.
 */
export async function requireUserId(req: NextRequest): Promise<string | NextResponse> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return user.id
}

export function isNextResponse(val: unknown): val is NextResponse {
  return val instanceof NextResponse
}
