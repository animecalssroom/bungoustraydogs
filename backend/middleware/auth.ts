import { createClient } from '@/frontend/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Profile } from '@/backend/types'
import { UserModel } from '@/backend/models/user.model'

async function resolveAuthenticatedUser() {
  const supabase = createClient()
  const userResult = await supabase.auth.getUser().catch(() => null)
  return userResult?.data.user ? { id: userResult.data.user.id } : null
}

export async function requireAuth(req: NextRequest): Promise<
  { user: { id: string }; profile: Profile } | NextResponse
> {
  const user = await resolveAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await UserModel.getById(user.id)
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return { user, profile }
}

/**
 * Lighter version of requireAuth that only verifies session and returns user ID.
 * Faster because it skips the profile database lookup.
 */
export async function requireUserId(req: NextRequest): Promise<string | NextResponse> {
  const user = await resolveAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return user.id
}

export function isNextResponse(val: unknown): val is NextResponse {
  return val instanceof NextResponse
}
