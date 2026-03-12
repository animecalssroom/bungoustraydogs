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
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }
  
  return { user, profile }
}

export function isNextResponse(val: unknown): val is NextResponse {
  return val instanceof NextResponse
}
