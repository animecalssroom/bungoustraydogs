import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { 
  CHARACTER_ASSIGNMENT_THRESHOLD, 
  QUALIFYING_ASSIGNMENT_EVENTS 
} from '@/backend/types'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (isNextResponse(auth)) {
    return auth
  }

  const userId = auth.user.id
  const profile = auth.profile

  // If already assigned, return complete state
  if (profile.character_match_id) {
    return NextResponse.json({
      assigned: true,
      characterName: profile.character_name,
      characterId: profile.character_match_id,
      progress: 100,
      current: CHARACTER_ASSIGNMENT_THRESHOLD,
      threshold: CHARACTER_ASSIGNMENT_THRESHOLD,
      message: 'Assessment complete. Character file active.',
      nextStep: 'Engage in faction activity to build AP and rank.'
    })
  }

  // Count qualifying events
  const { count, error } = await supabaseAdmin
    .from('user_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('event_type', QUALIFYING_ASSIGNMENT_EVENTS)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }

  const currentCount = count ?? 0
  const progressPercent = Math.min(Math.floor((currentCount / CHARACTER_ASSIGNMENT_THRESHOLD) * 100), 100)
  
  let message = `File recording in progress: ${currentCount} / ${CHARACTER_ASSIGNMENT_THRESHOLD} events.`
  let nextStep = 'Engage in transmissions, archive research, or registry filing.'

  if (currentCount >= CHARACTER_ASSIGNMENT_THRESHOLD) {
    message = 'Qualifying threshold reached. Assessment pending.'
    nextStep = 'The city is currently matching your profile. Check back within one hour.'
  }

  return NextResponse.json({
    assigned: false,
    progress: progressPercent,
    current: currentCount,
    threshold: CHARACTER_ASSIGNMENT_THRESHOLD,
    message,
    nextStep
  })
}
